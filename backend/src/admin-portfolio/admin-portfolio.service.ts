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
import {
  AdminProjectsQueryDto,
  CreateCategoryDto,
  CreateCollaboratorDto,
  CreateHighlightDto,
  CreateProjectDto,
  CreateSkillDto,
  CreateSocialLinkDto,
  CreateTechnologyDto,
  UpdateCategoryDto,
  UpdateCollaboratorDto,
  UpdateHighlightDto,
  UpdateProjectDto,
  UpdateProfileDto,
  UpdateSkillDto,
  UpdateSocialLinkDto,
  UpdateTechnologyDto,
} from './dto/admin-portfolio.dto.js';

type ActivityAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
type ChildKind = 'technologies' | 'highlights' | 'collaborators';
type ChildTable = 'project_technologies' | 'project_highlights' | 'project_collaborators';

const childTables: Record<ChildKind, ChildTable> = {
  technologies: 'project_technologies',
  highlights: 'project_highlights',
  collaborators: 'project_collaborators',
};

const projectRelations = `
  *,
  category:project_categories(id,name,slug,label,description),
  technologies:project_technologies(id,name,role,sort_order),
  highlights:project_highlights(id,content,sort_order),
  collaborators:project_collaborators(id,name,role,avatar_path,github_url,linkedin_url,sort_order)
`;

function cleanPayload(input: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

function sortProjectChildren(project: Record<string, any>) {
  for (const key of ['technologies', 'highlights', 'collaborators']) {
    if (Array.isArray(project[key])) {
      project[key].sort(
        (left: Record<string, any>, right: Record<string, any>) =>
          (left.sort_order ?? 0) - (right.sort_order ?? 0),
      );
    }
  }
  return project;
}

@Injectable()
export class AdminPortfolioService {
  private readonly db: any;
  private readonly logger = new Logger(AdminPortfolioService.name);

  constructor(supabase: SupabaseService) {
    this.db = supabase.getServiceClient();
  }

  private handleDatabaseError(error: { code?: string }, message: string): never {
    switch (error.code) {
      case '23505':
        throw new ConflictException('Ya existe un registro con ese identificador o valor único.');
      case '23503':
        throw new ConflictException('No se puede completar la operación porque existen registros relacionados.');
      case '23514':
      case '23502':
      case '22P02':
      case '22001':
        throw new BadRequestException('Los datos enviados no cumplen las reglas de la base de datos.');
      default:
        throw new InternalServerErrorException(message);
    }
  }

  private async logActivity(
    admin: AuthenticatedAdmin,
    action: ActivityAction,
    entityType: string,
    entityId: string,
    summary: string,
  ): Promise<void> {
    const { error } = await this.db.from('admin_activity_logs').insert({
      admin_user_id: admin.userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      metadata: { source: 'admin-api', admin_role: admin.role },
    });

    // Keep the content mutation successful if the separate audit insert fails.
    // The failure is visible in server logs and should be monitored operationally.
    if (error) this.logger.error(`No se pudo registrar actividad (${action}/${entityType}). Código: ${error.code ?? 'unknown'}`);
  }

  private async projectExists(projectId: string): Promise<void> {
    const { data, error } = await this.db
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible comprobar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
  }

  private async assertActiveCategory(categoryId: string): Promise<void> {
    const { data, error } = await this.db
      .from('project_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible comprobar la categoría.');
    if (!data) throw new BadRequestException('Debes seleccionar una categoría activa.');
  }

  // ---------------------------------------------------------------------------
  // Perfil
  // ---------------------------------------------------------------------------

  async getProfile() {
    const { data, error } = await this.db
      .from('portfolio_profile')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible cargar el perfil.');
    if (!data) throw new NotFoundException('No existe el perfil base.');
    return data;
  }

  async updateProfile(dto: UpdateProfileDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Debes enviar al menos un campo para actualizar.');
    }

    const { data, error } = await this.db
      .from('portfolio_profile')
      .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar el perfil.');
    await this.logActivity(admin, 'update', 'portfolio_profile', '1', 'Actualizó el perfil profesional.');
    return data;
  }

  // ---------------------------------------------------------------------------
  // Enlaces sociales
  // ---------------------------------------------------------------------------

  async listSocialLinks() {
    const { data, error } = await this.db
      .from('social_links')
      .select('*')
      .eq('profile_id', 1)
      .order('sort_order', { ascending: true });
    if (error) this.handleDatabaseError(error, 'No fue posible cargar los enlaces sociales.');
    return data ?? [];
  }

  async createSocialLink(dto: CreateSocialLinkDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    const { data, error } = await this.db
      .from('social_links')
      .insert({ profile_id: 1, sort_order: 0, is_visible: true, ...payload })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible crear el enlace social.');
    await this.logActivity(admin, 'create', 'social_link', data.id, 'Creó un enlace social.');
    return data;
  }

  async updateSocialLink(id: string, dto: UpdateSocialLinkDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    if (Object.keys(payload).length === 0) throw new BadRequestException('No hay campos para actualizar.');
    const { data, error } = await this.db
      .from('social_links')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('profile_id', 1)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar el enlace social.');
    if (!data) throw new NotFoundException('Enlace social no encontrado.');
    await this.logActivity(admin, 'update', 'social_link', id, 'Actualizó un enlace social.');
    return data;
  }

  async deleteSocialLink(id: string, admin: AuthenticatedAdmin) {
    const { data, error } = await this.db
      .from('social_links')
      .delete()
      .eq('id', id)
      .eq('profile_id', 1)
      .select('id')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible eliminar el enlace social.');
    if (!data) throw new NotFoundException('Enlace social no encontrado.');
    await this.logActivity(admin, 'delete', 'social_link', id, 'Eliminó un enlace social.');
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Habilidades
  // ---------------------------------------------------------------------------

  async listSkills() {
    const { data, error } = await this.db
      .from('skills')
      .select('*')
      .order('group_type', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) this.handleDatabaseError(error, 'No fue posible cargar las habilidades.');
    return data ?? [];
  }

  private normalizeSkill(dto: CreateSkillDto | UpdateSkillDto) {
    const payload = cleanPayload(dto);
    const group = payload.group_type;
    if (group === 'technical' && payload.level == null) {
      throw new BadRequestException('Las habilidades técnicas deben incluir un nivel entre 0 y 100.');
    }
    if (group === 'tools' || group === 'interests') payload.level = null;
    return payload;
  }

  async createSkill(dto: CreateSkillDto, admin: AuthenticatedAdmin) {
    const payload = this.normalizeSkill(dto);
    const { data, error } = await this.db
      .from('skills')
      .insert({ sort_order: 0, is_visible: true, ...payload })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible crear la habilidad.');
    await this.logActivity(admin, 'create', 'skill', data.id, 'Creó una habilidad.');
    return data;
  }

  async updateSkill(id: string, dto: UpdateSkillDto, admin: AuthenticatedAdmin) {
    const payload = this.normalizeSkill(dto);
    if (Object.keys(payload).length === 0) throw new BadRequestException('No hay campos para actualizar.');
    const { data: current, error: currentError } = await this.db
      .from('skills')
      .select('group_type,level')
      .eq('id', id)
      .maybeSingle();
    if (currentError) this.handleDatabaseError(currentError, 'No fue posible consultar la habilidad.');
    if (!current) throw new NotFoundException('Habilidad no encontrada.');
    const resultingGroup = (payload.group_type ?? current.group_type) as string;
    const resultingLevel = Object.prototype.hasOwnProperty.call(payload, 'level') ? payload.level : current.level;
    if (resultingGroup === 'technical' && resultingLevel == null) {
      throw new BadRequestException('Las habilidades técnicas deben incluir un nivel entre 0 y 100.');
    }
    if (resultingGroup !== 'technical') payload.level = null;

    const { data, error } = await this.db
      .from('skills')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar la habilidad.');
    if (!data) throw new NotFoundException('Habilidad no encontrada.');
    await this.logActivity(admin, 'update', 'skill', id, 'Actualizó una habilidad.');
    return data;
  }

  async deleteSkill(id: string, admin: AuthenticatedAdmin) {
    const { data, error } = await this.db.from('skills').delete().eq('id', id).select('id').maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible eliminar la habilidad.');
    if (!data) throw new NotFoundException('Habilidad no encontrada.');
    await this.logActivity(admin, 'delete', 'skill', id, 'Eliminó una habilidad.');
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Categorías
  // ---------------------------------------------------------------------------

  async listCategories() {
    const { data, error } = await this.db
      .from('project_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) this.handleDatabaseError(error, 'No fue posible cargar las categorías.');
    return data ?? [];
  }

  async createCategory(dto: CreateCategoryDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    const { data, error } = await this.db
      .from('project_categories')
      .insert({ sort_order: 0, is_active: true, ...payload })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible crear la categoría.');
    await this.logActivity(admin, 'create', 'project_category', data.id, 'Creó una categoría de proyectos.');
    return data;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    if (Object.keys(payload).length === 0) throw new BadRequestException('No hay campos para actualizar.');
    const { data, error } = await this.db
      .from('project_categories')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar la categoría.');
    if (!data) throw new NotFoundException('Categoría no encontrada.');
    await this.logActivity(admin, 'update', 'project_category', id, 'Actualizó una categoría de proyectos.');
    return data;
  }

  async deleteCategory(id: string, admin: AuthenticatedAdmin) {
    const { data, error } = await this.db
      .from('project_categories')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible eliminar la categoría.');
    if (!data) throw new NotFoundException('Categoría no encontrada.');
    await this.logActivity(admin, 'delete', 'project_category', id, 'Eliminó una categoría de proyectos.');
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Proyectos
  // ---------------------------------------------------------------------------

  async listProjects(query: AdminProjectsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const from = (page - 1) * limit;
    let request = this.db
      .from('projects')
      .select(projectRelations, { count: 'exact' })
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });
    if (query.status) request = request.eq('status', query.status);
    if (query.category_id) request = request.eq('category_id', query.category_id);
    if (query.is_published !== undefined) request = request.eq('is_published', query.is_published);
    if (query.is_featured !== undefined) request = request.eq('is_featured', query.is_featured);
    const { data, error, count } = await request.range(from, from + limit - 1);
    if (error) this.handleDatabaseError(error, 'No fue posible cargar los proyectos.');
    const total = count ?? 0;
    return {
      items: (data ?? []).map((project: Record<string, any>) => sortProjectChildren(project)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProject(id: string) {
    const { data, error } = await this.db
      .from('projects')
      .select(projectRelations)
      .eq('id', id)
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible cargar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    return sortProjectChildren(data as Record<string, any>);
  }

  async createProject(dto: CreateProjectDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    await this.assertActiveCategory(String(payload.category_id));
    const { data, error } = await this.db
      .from('projects')
      .insert({
        status: 'in_progress',
        is_featured: false,
        sort_order: 0,
        ...payload,
        // Creation never publishes implicitly; publication has its own endpoint.
        is_published: false,
        published_at: null,
      })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible crear el proyecto.');
    await this.logActivity(admin, 'create', 'project', data.id, 'Creó un proyecto.');
    return data;
  }

  async updateProject(id: string, dto: UpdateProjectDto, admin: AuthenticatedAdmin) {
    const payload = cleanPayload(dto);
    if (Object.keys(payload).length === 0) throw new BadRequestException('No hay campos para actualizar.');
    if (payload.category_id !== undefined) await this.assertActiveCategory(String(payload.category_id));
    const { data, error } = await this.db
      .from('projects')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    await this.logActivity(admin, 'update', 'project', id, 'Actualizó un proyecto.');
    return data;
  }

  async deleteProject(id: string, admin: AuthenticatedAdmin) {
    const { data, error } = await this.db
      .from('projects')
      .delete()
      .eq('id', id)
      .select('id,title')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible eliminar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    await this.logActivity(admin, 'delete', 'project', id, `Eliminó el proyecto ${data.title}.`);
    return { deleted: true, id };
  }

  async publishProject(id: string, admin: AuthenticatedAdmin) {
    const project = await this.getProject(id);
    if (project.is_published) return project;
    const { data, error } = await this.db
      .from('projects')
      .update({ is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible publicar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    await this.logActivity(admin, 'publish', 'project', id, `Publicó el proyecto ${project.title}.`);
    return data;
  }

  async unpublishProject(id: string, admin: AuthenticatedAdmin) {
    const project = await this.getProject(id);
    if (!project.is_published) return project;
    const { data, error } = await this.db
      .from('projects')
      .update({ is_published: false, published_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible retirar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    await this.logActivity(admin, 'unpublish', 'project', id, `Retiró el proyecto ${project.title} de publicación.`);
    return data;
  }

  // ---------------------------------------------------------------------------
  // Relaciones del proyecto. Cada operación modifica una única tabla para no
  // simular transacciones entre varias llamadas REST no transaccionales.
  // ---------------------------------------------------------------------------

  async listProjectChildren(projectId: string, kind: ChildKind) {
    await this.projectExists(projectId);
    const table = childTables[kind];
    const { data, error } = await this.db
      .from(table)
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (error) this.handleDatabaseError(error, 'No fue posible cargar los elementos del proyecto.');
    return data ?? [];
  }

  async createProjectChild(
    projectId: string,
    kind: ChildKind,
    dto: CreateTechnologyDto | CreateHighlightDto | CreateCollaboratorDto,
    admin: AuthenticatedAdmin,
  ) {
    await this.projectExists(projectId);
    const table = childTables[kind];
    const payload = cleanPayload(dto);
    const { data, error } = await this.db
      .from(table)
      .insert({ project_id: projectId, sort_order: 0, ...payload })
      .select('*')
      .single();
    if (error) this.handleDatabaseError(error, 'No fue posible crear el elemento del proyecto.');
    await this.logActivity(admin, 'create', `project_${kind}`, data.id, `Agregó un elemento a ${kind} del proyecto.`);
    return data;
  }

  async updateProjectChild(
    projectId: string,
    childId: string,
    kind: ChildKind,
    dto: UpdateTechnologyDto | UpdateHighlightDto | UpdateCollaboratorDto,
    admin: AuthenticatedAdmin,
  ) {
    const payload = cleanPayload(dto);
    if (Object.keys(payload).length === 0) throw new BadRequestException('No hay campos para actualizar.');
    const table = childTables[kind];
    const { data, error } = await this.db
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('id', childId)
      .select('*')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible actualizar el elemento del proyecto.');
    if (!data) throw new NotFoundException('Elemento del proyecto no encontrado.');
    await this.logActivity(admin, 'update', `project_${kind}`, childId, `Actualizó un elemento de ${kind} del proyecto.`);
    return data;
  }

  async deleteProjectChild(projectId: string, childId: string, kind: ChildKind, admin: AuthenticatedAdmin) {
    const table = childTables[kind];
    const { data, error } = await this.db
      .from(table)
      .delete()
      .eq('project_id', projectId)
      .eq('id', childId)
      .select('id')
      .maybeSingle();
    if (error) this.handleDatabaseError(error, 'No fue posible eliminar el elemento del proyecto.');
    if (!data) throw new NotFoundException('Elemento del proyecto no encontrado.');
    await this.logActivity(admin, 'delete', `project_${kind}`, childId, `Eliminó un elemento de ${kind} del proyecto.`);
    return { deleted: true, id: childId };
  }
}
