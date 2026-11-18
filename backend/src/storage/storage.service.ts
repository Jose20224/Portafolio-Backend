import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { AuthenticatedAdmin } from '../auth/auth.types.js';
import { detectPortfolioImageMime } from './image-signature.js';
import {
  PORTFOLIO_IMAGE_TYPES,
  type PortfolioImageMimeType,
  type StorageArea,
} from './dto/storage.dto.js';

const BUCKET = 'portfolio-media';
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const CACHE_CONTROL = '3600';
const SIGNED_UPLOAD_TTL_SECONDS = 2 * 60 * 60;

const MIME_EXTENSIONS: Record<PortfolioImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const EXTENSION_MIME: Record<string, PortfolioImageMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

@Injectable()
export class StorageService {
  private readonly db: any;
  private readonly logger = new Logger(StorageService.name);

  constructor(supabase: SupabaseService) {
    this.db = supabase.getServiceClient();
  }

  async createUploadUrl(
    input: {
      area: StorageArea;
      fileName: string;
      contentType: PortfolioImageMimeType;
      size: number;
    },
    admin: AuthenticatedAdmin,
  ) {
    if (!PORTFOLIO_IMAGE_TYPES.includes(input.contentType)) {
      throw new BadRequestException('El formato de imagen no está permitido.');
    }
    if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_FILE_SIZE) {
      throw new BadRequestException('La imagen debe pesar entre 1 byte y 8 MB.');
    }

    const extension = MIME_EXTENSIONS[input.contentType];
    const safeBaseName = this.safeBaseName(input.fileName);
    // Every upload receives a fresh path; replacing an existing public asset is avoided
    // to prevent stale CDN copies and accidental overwrites.
    const path = `${input.area}/${randomUUID()}-${safeBaseName}.${extension}`;
    const { data, error } = await this.db.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token || !data?.signedUrl) {
      this.logStorageError('No se pudo crear el enlace firmado de carga', error);
      throw new InternalServerErrorException('No fue posible preparar la carga de la imagen.');
    }

    return {
      bucket: BUCKET,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: this.publicUrl(data.path),
      contentType: input.contentType,
      maxFileSize: MAX_FILE_SIZE,
      expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
      cacheControl: CACHE_CONTROL,
    };
  }

  async confirmUpload(path: string, admin: AuthenticatedAdmin) {
    this.assertManagedPath(path);

    const { data: blob, error } = await this.db.storage.from(BUCKET).download(path);
    if (error || !blob) {
      if (error?.statusCode === '404' || error?.status === 404) {
        throw new NotFoundException('No se encontró el archivo cargado.');
      }
      this.logStorageError('No se pudo verificar el archivo cargado', error);
      throw new InternalServerErrorException('No fue posible verificar la imagen cargada.');
    }

    if (blob.size < 1 || blob.size > MAX_FILE_SIZE) {
      await this.removeInvalidUpload(path);
      throw new BadRequestException('El archivo cargado supera el límite permitido o está vacío.');
    }

    const expectedMime = EXTENSION_MIME[path.split('.').pop()?.toLowerCase() ?? ''];
    const bytes = Buffer.from(await blob.arrayBuffer());
    const detectedMime = detectPortfolioImageMime(bytes);
    if (!expectedMime || !detectedMime || detectedMime !== expectedMime) {
      await this.removeInvalidUpload(path);
      throw new BadRequestException('El contenido del archivo no coincide con un formato de imagen permitido.');
    }

    const response = {
      bucket: BUCKET,
      path,
      publicUrl: this.publicUrl(path),
      size: blob.size,
      contentType: detectedMime,
    };

    await this.logActivity(admin, 'upload', path, 'Cargó una imagen en el almacenamiento.', {
      bucket: BUCKET,
      size: blob.size,
      content_type: detectedMime,
    });

    return response;
  }

  async listObjects(folder: StorageArea, limit: number, offset: number) {
    const { data, error } = await this.db.storage.from(BUCKET).list(folder, {
      limit,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      this.logStorageError('No se pudo listar el almacenamiento', error);
      throw new InternalServerErrorException('No fue posible cargar las imágenes.');
    }

    const items = (data ?? [])
      .filter((item: any) => item?.name && item.id)
      .map((item: any) => {
        const path = `${folder}/${item.name}`;
        return {
          name: item.name,
          path,
          publicUrl: this.publicUrl(path),
          size: Number(item.metadata?.size ?? 0),
          contentType: item.metadata?.mimetype ?? null,
          createdAt: item.created_at ?? null,
          updatedAt: item.updated_at ?? null,
        };
      });

    return { items, pagination: { limit, offset, returned: items.length } };
  }

  async deleteObject(path: string, admin: AuthenticatedAdmin) {
    this.assertManagedPath(path);

    if (await this.isReferenced(path)) {
      throw new ConflictException(
        'No se puede eliminar esta imagen porque está asociada al perfil o a un proyecto. Reemplaza primero la referencia.',
      );
    }

    const { data: existing, error: downloadError } = await this.db.storage.from(BUCKET).download(path);
    if (downloadError || !existing) {
      if (downloadError?.statusCode === '404' || downloadError?.status === 404) {
        throw new NotFoundException('La imagen no existe en el almacenamiento.');
      }
      this.logStorageError('No se pudo comprobar el archivo antes de eliminarlo', downloadError);
      throw new InternalServerErrorException('No fue posible comprobar la imagen.');
    }

    const { error } = await this.db.storage.from(BUCKET).remove([path]);
    if (error) {
      this.logStorageError('No se pudo eliminar la imagen', error);
      throw new InternalServerErrorException('No fue posible eliminar la imagen.');
    }

    await this.logActivity(admin, 'delete', path, 'Eliminó una imagen del almacenamiento.', {
      bucket: BUCKET,
    });

    return { deleted: true, path };
  }

  private publicUrl(path: string): string {
    const { data } = this.db.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  private safeBaseName(fileName: string): string {
    const withoutExtension = fileName.trim().replace(/\.[^.]+$/, '');
    const safe = withoutExtension
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    return safe || 'imagen';
  }

  private assertManagedPath(path: string): asserts path is string {
    if (
      typeof path !== 'string' ||
      path.length > 300 ||
      path.includes('..') ||
      path.includes('\\') ||
      path.startsWith('/') ||
      path.split('/').length !== 2
    ) {
      throw new BadRequestException('La ruta del archivo no es válida.');
    }

    const [folder, fileName] = path.split('/');
    const fileExtension = fileName?.split('.').pop()?.toLowerCase() ?? '';
    if (
      !['profile', 'projects', 'collaborators'].includes(folder) ||
      !/^[a-zA-Z0-9-]{1,240}\.(jpg|jpeg|png|webp|avif|gif)$/i.test(fileName ?? '') ||
      !EXTENSION_MIME[fileExtension]
    ) {
      throw new BadRequestException('La ruta del archivo no pertenece a las carpetas permitidas.');
    }
  }


  private async removeInvalidUpload(path: string): Promise<void> {
    const { error } = await this.db.storage.from(BUCKET).remove([path]);
    if (error) this.logStorageError('No se pudo retirar un archivo no válido', error);
  }

  private async isReferenced(path: string): Promise<boolean> {
    const checks = await Promise.all([
      this.db.from('portfolio_profile').select('id').eq('hero_image_path', path).limit(1),
      this.db.from('projects').select('id').eq('card_image_path', path).limit(1),
      this.db.from('projects').select('id').eq('cover_image_path', path).limit(1),
      this.db.from('project_collaborators').select('id').eq('avatar_path', path).limit(1),
    ]);

    for (const check of checks) {
      if (check.error) {
        this.logger.error(`No se pudo comprobar si una imagen está en uso. Código: ${check.error.code ?? 'unknown'}`);
        throw new InternalServerErrorException('No fue posible comprobar si la imagen está siendo utilizada.');
      }
      if ((check.data ?? []).length > 0) return true;
    }

    return false;
  }

  private async logActivity(
    admin: AuthenticatedAdmin,
    action: 'upload' | 'delete',
    path: string,
    summary: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.db.from('admin_activity_logs').insert({
      admin_user_id: admin.userId,
      action,
      entity_type: 'storage_object',
      entity_id: path,
      summary,
      metadata: {
        source: 'admin-api',
        admin_role: admin.role,
        ...metadata,
      },
    });

    if (error) {
      this.logger.error(`No se pudo registrar la actividad de almacenamiento. Código: ${error.code ?? 'unknown'}`);
    }
  }

  private logStorageError(context: string, error: any): void {
    this.logger.error(`${context}. Código: ${error?.statusCode ?? error?.status ?? error?.name ?? 'unknown'}`);
  }
}
