import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator.js';
import { NoStoreInterceptor } from '../common/interceptors/no-store.interceptor.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
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
import { AdminPortfolioService } from './admin-portfolio.service.js';

@Controller('admin/portfolio')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('owner', 'editor')
@UseInterceptors(new NoStoreInterceptor())
export class AdminPortfolioController {
  constructor(private readonly portfolio: AdminPortfolioService) {}

  // Profile
  @Get('profile')
  getProfile() {
    return this.portfolio.getProfile();
  }

  @Patch('profile')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.updateProfile(dto, admin);
  }

  // Social links
  @Get('social-links')
  listSocialLinks() {
    return this.portfolio.listSocialLinks();
  }

  @Post('social-links')
  createSocialLink(@Body() dto: CreateSocialLinkDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.createSocialLink(dto, admin);
  }

  @Patch('social-links/:id')
  updateSocialLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSocialLinkDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateSocialLink(id, dto, admin);
  }

  @Delete('social-links/:id')
  deleteSocialLink(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.deleteSocialLink(id, admin);
  }

  // Skills
  @Get('skills')
  listSkills() {
    return this.portfolio.listSkills();
  }

  @Post('skills')
  createSkill(@Body() dto: CreateSkillDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.createSkill(dto, admin);
  }

  @Patch('skills/:id')
  updateSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateSkill(id, dto, admin);
  }

  @Delete('skills/:id')
  deleteSkill(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.deleteSkill(id, admin);
  }

  // Project categories
  @Get('categories')
  listCategories() {
    return this.portfolio.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.createCategory(dto, admin);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateCategory(id, dto, admin);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.deleteCategory(id, admin);
  }

  // Projects
  @Get('projects')
  listProjects(@Query() query: AdminProjectsQueryDto) {
    return this.portfolio.listProjects(query);
  }

  @Post('projects')
  createProject(@Body() dto: CreateProjectDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.createProject(dto, admin);
  }

  @Get('projects/:id')
  getProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.portfolio.getProject(id);
  }

  @Patch('projects/:id')
  updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateProject(id, dto, admin);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.deleteProject(id, admin);
  }

  @Post('projects/:id/publish')
  publishProject(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.publishProject(id, admin);
  }

  @Post('projects/:id/unpublish')
  unpublishProject(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.portfolio.unpublishProject(id, admin);
  }

  // Technologies
  @Get('projects/:projectId/technologies')
  listTechnologies(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.portfolio.listProjectChildren(projectId, 'technologies');
  }

  @Post('projects/:projectId/technologies')
  createTechnology(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTechnologyDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.createProjectChild(projectId, 'technologies', dto, admin);
  }

  @Patch('projects/:projectId/technologies/:childId')
  updateTechnology(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdateTechnologyDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateProjectChild(projectId, childId, 'technologies', dto, admin);
  }

  @Delete('projects/:projectId/technologies/:childId')
  deleteTechnology(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.deleteProjectChild(projectId, childId, 'technologies', admin);
  }

  // Highlights
  @Get('projects/:projectId/highlights')
  listHighlights(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.portfolio.listProjectChildren(projectId, 'highlights');
  }

  @Post('projects/:projectId/highlights')
  createHighlight(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateHighlightDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.createProjectChild(projectId, 'highlights', dto, admin);
  }

  @Patch('projects/:projectId/highlights/:childId')
  updateHighlight(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdateHighlightDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateProjectChild(projectId, childId, 'highlights', dto, admin);
  }

  @Delete('projects/:projectId/highlights/:childId')
  deleteHighlight(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.deleteProjectChild(projectId, childId, 'highlights', admin);
  }

  // Collaborators
  @Get('projects/:projectId/collaborators')
  listCollaborators(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.portfolio.listProjectChildren(projectId, 'collaborators');
  }

  @Post('projects/:projectId/collaborators')
  createCollaborator(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateCollaboratorDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.createProjectChild(projectId, 'collaborators', dto, admin);
  }

  @Patch('projects/:projectId/collaborators/:childId')
  updateCollaborator(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdateCollaboratorDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.updateProjectChild(projectId, childId, 'collaborators', dto, admin);
  }

  @Delete('projects/:projectId/collaborators/:childId')
  deleteCollaborator(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.portfolio.deleteProjectChild(projectId, childId, 'collaborators', admin);
  }
}
