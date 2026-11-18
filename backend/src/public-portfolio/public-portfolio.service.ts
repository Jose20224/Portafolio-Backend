import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { ProjectsQueryDto } from './dto/projects-query.dto.js';

const MEDIA_BUCKET = 'portfolio-media';

const projectRelations = `
  *,
  category:project_categories(id,name,slug,label,description),
  technologies:project_technologies(id,name,role,sort_order),
  highlights:project_highlights(id,content,sort_order),
  collaborators:project_collaborators(id,name,role,avatar_path,github_url,linkedin_url,sort_order)
`;

function sortChildren(project: Record<string, any>) {
  for (const key of ['technologies', 'highlights', 'collaborators']) {
    if (Array.isArray(project[key])) {
      project[key].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
  }
  return project;
}

@Injectable()
export class PublicPortfolioService {
  private readonly db;

  constructor(supabase: SupabaseService) {
    this.db = supabase.getServiceClient();
  }

  private publicMediaUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return this.db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  private addProjectMediaUrls(project: Record<string, any>) {
    project.card_image_url = this.publicMediaUrl(project.card_image_path);
    project.cover_image_url = this.publicMediaUrl(project.cover_image_path);
    if (Array.isArray(project.collaborators)) {
      project.collaborators = project.collaborators.map((collaborator: Record<string, any>) => ({
        ...collaborator,
        avatar_url: this.publicMediaUrl(collaborator.avatar_path),
      }));
    }
    return project;
  }

  async getProfile() {
    const { data, error } = await this.db
      .from('portfolio_profile')
      .select('id,full_name,professional_title,hero_badge_text,hero_description,hero_image_path,about_paragraphs,strengths,location,work_mode,contact_email,availability_status')
      .eq('id', 1)
      .eq('is_public', true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException('No fue posible cargar el perfil.');
    if (!data) throw new NotFoundException('El perfil público aún no está disponible.');
    return { ...data, hero_image_url: this.publicMediaUrl(data.hero_image_path) };
  }

  async getSocialLinks() {
    const { data, error } = await this.db
      .from('social_links')
      .select('id,platform,label,url,sort_order')
      .eq('profile_id', 1)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('No fue posible cargar los enlaces sociales.');
    return data ?? [];
  }

  async getSkills() {
    const { data, error } = await this.db
      .from('skills')
      .select('id,group_type,name,level,sort_order')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('No fue posible cargar las habilidades.');
    const groups: Record<string, any[]> = { technical: [], tools: [], interests: [] };
    for (const skill of data ?? []) groups[skill.group_type]?.push(skill);
    return groups;
  }

  async getCategories() {
    const { data, error } = await this.db
      .from('project_categories')
      .select('id,name,slug,label,description,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('No fue posible cargar las categorías.');
    return data ?? [];
  }

  async getProjects(query: ProjectsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const from = (page - 1) * limit;
    let categoryId: string | undefined;

    if (query.category) {
      const { data: category, error: categoryError } = await this.db
        .from('project_categories')
        .select('id')
        .eq('slug', query.category)
        .eq('is_active', true)
        .maybeSingle();
      if (categoryError) throw new InternalServerErrorException('No fue posible filtrar proyectos.');
      if (!category) return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      categoryId = category.id;
    }

    let request = this.db
      .from('projects')
      .select(projectRelations, { count: 'exact' })
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });
    if (categoryId) request = request.eq('category_id', categoryId);
    if (query.featured === true) request = request.eq('is_featured', true);
    const { data, error, count } = await request.range(from, from + limit - 1);
    if (error) throw new InternalServerErrorException('No fue posible cargar los proyectos.');
    const total = count ?? 0;
    return {
      items: (data ?? []).map((project: Record<string, any>) =>
        this.addProjectMediaUrls(sortChildren(project)),
      ),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProjectBySlug(slug: string) {
    const { data, error } = await this.db
      .from('projects')
      .select(projectRelations)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException('No fue posible cargar el proyecto.');
    if (!data) throw new NotFoundException('Proyecto no encontrado.');
    return this.addProjectMediaUrls(sortChildren(data as Record<string, any>));
  }
}
