import { createHash } from 'node:crypto';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { AuthenticatedAdmin } from '../auth/auth.types.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { ContactMessagesQueryDto } from './dto/contact-messages-query.dto.js';
import type { ContactMessageStatus } from './dto/contact-messages-query.dto.js';
import { ContactRateLimitService } from './contact-rate-limit.service.js';

const ACCEPTED_RESPONSE = {
  accepted: true,
  message: 'Gracias por escribir. Tu mensaje fue recibido.',
};

@Injectable()
export class ContactMessagesService {
  private readonly db: any;
  private readonly logger = new Logger(ContactMessagesService.name);

  constructor(
    supabase: SupabaseService,
    private readonly rateLimit: ContactRateLimitService,
  ) {
    this.db = supabase.getServiceClient();
  }

  async submitPublicMessage(dto: CreateContactMessageDto, ipAddress: string) {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const subject = dto.subject?.trim() || null;
    const message = dto.message.trim();

    // Return the same success shape for trap submissions. Do not tell bots
    // which anti-spam rule detected them, and do not store the submitted data.
    if (dto.website?.trim()) return ACCEPTED_RESPONSE;

    if (dto.formStartedAt !== undefined) {
      const elapsed = Date.now() - dto.formStartedAt;
      if (elapsed < 1800) return ACCEPTED_RESPONSE;
    }

    this.rateLimit.consume([
      {
        key: `ip:${this.fingerprint(ipAddress || 'unknown')}`,
        limit: 5,
        message: 'Has enviado demasiados mensajes. Inténtalo nuevamente más tarde.',
      },
      {
        key: `email:${this.fingerprint(email)}`,
        limit: 3,
        message: 'Has enviado demasiados mensajes desde este correo. Inténtalo más tarde.',
      },
    ]);

    const { error } = await this.db.from('contact_messages').insert({
      name,
      email,
      subject,
      message,
      // status is omitted to use the database default ('new').
    });

    if (error) {
      this.logger.error(`No fue posible guardar un mensaje de contacto. Código: ${error.code ?? 'unknown'}`);
      throw new InternalServerErrorException('No fue posible recibir tu mensaje en este momento.');
    }

    return ACCEPTED_RESPONSE;
  }

  async listMessages(query: ContactMessagesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const from = (page - 1) * limit;

    let request = this.db
      .from('contact_messages')
      .select('id,name,email,subject,message,status,reviewed_at,replied_at,created_at,updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (query.status) request = request.eq('status', query.status);

    // Restrict characters used in PostgREST filter syntax before interpolating
    // the search term. Search is intentionally limited to name/email/subject.
    const search = query.q?.trim().replace(/[^a-zA-Z0-9 @._+-]/g, '').slice(0, 80);
    if (search) {
      const value = search.replace(/[%_]/g, '').trim();
      if (value) {
        request = request.or(
          `name.ilike."%${value}%",email.ilike."%${value}%",subject.ilike."%${value}%"`,
        );
      }
    }

    const { data, error, count } = await request;
    if (error) throw new InternalServerErrorException('No fue posible cargar los mensajes de contacto.');

    const total = count ?? 0;
    return {
      items: data ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMessage(id: string) {
    const { data, error } = await this.db
      .from('contact_messages')
      .select('id,name,email,subject,message,status,reviewed_at,replied_at,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException('No fue posible cargar el mensaje.');
    if (!data) throw new NotFoundException('Mensaje de contacto no encontrado.');
    return data;
  }

  async getStats() {
    const statuses: ContactMessageStatus[] = ['new', 'read', 'replied', 'archived'];
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await this.db
          .from('contact_messages')
          .select('id', { count: 'exact', head: true })
          .eq('status', status);
        if (error) throw new InternalServerErrorException('No fue posible cargar las estadísticas de contacto.');
        return [status, count ?? 0] as const;
      }),
    );

    const { count: total, error } = await this.db
      .from('contact_messages')
      .select('id', { count: 'exact', head: true });
    if (error) throw new InternalServerErrorException('No fue posible cargar las estadísticas de contacto.');

    return {
      total: total ?? 0,
      byStatus: Object.fromEntries(counts),
    };
  }

  async updateStatus(id: string, status: ContactMessageStatus, admin: AuthenticatedAdmin) {
    const { data: current, error: readError } = await this.db
      .from('contact_messages')
      .select('id,status,reviewed_at,replied_at')
      .eq('id', id)
      .maybeSingle();
    if (readError) throw new InternalServerErrorException('No fue posible consultar el mensaje.');
    if (!current) throw new NotFoundException('Mensaje de contacto no encontrado.');

    if (current.status === status) {
      return this.getMessage(id);
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    if (status === 'new') {
      payload.reviewed_at = null;
    } else if (!current.reviewed_at) {
      payload.reviewed_at = now;
    }

    if (status === 'replied' && !current.replied_at) {
      payload.replied_at = now;
    }

    const { data, error } = await this.db
      .from('contact_messages')
      .update(payload)
      .eq('id', id)
      .select('id,name,email,subject,message,status,reviewed_at,replied_at,created_at,updated_at')
      .maybeSingle();
    if (error) throw new InternalServerErrorException('No fue posible actualizar el estado del mensaje.');
    if (!data) throw new NotFoundException('Mensaje de contacto no encontrado.');

    await this.logStatusChange(admin, id, current.status, status);
    return data;
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private async logStatusChange(
    admin: AuthenticatedAdmin,
    id: string,
    previousStatus: string,
    nextStatus: string,
  ): Promise<void> {
    const { error } = await this.db.from('admin_activity_logs').insert({
      admin_user_id: admin.userId,
      action: 'status_change',
      entity_type: 'contact_message',
      entity_id: id,
      summary: `Cambió el estado de un mensaje de contacto (${previousStatus} → ${nextStatus}).`,
      metadata: {
        source: 'admin-api',
        admin_role: admin.role,
        previous_status: previousStatus,
        next_status: nextStatus,
      },
    });

    if (error) {
      this.logger.error(`No se pudo registrar el cambio de estado del mensaje ${id}. Código: ${error.code ?? 'unknown'}`);
    }
  }
}
