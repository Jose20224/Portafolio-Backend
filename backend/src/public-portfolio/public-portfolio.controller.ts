import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicPortfolioService } from './public-portfolio.service.js';
import { ProjectsQueryDto } from './dto/projects-query.dto.js';

@Controller('portfolio')
export class PublicPortfolioController {
  constructor(private readonly portfolio: PublicPortfolioService) {}

  @Get('profile')
  getProfile() { return this.portfolio.getProfile(); }

  @Get('social-links')
  getSocialLinks() { return this.portfolio.getSocialLinks(); }

  @Get('skills')
  getSkills() { return this.portfolio.getSkills(); }

  @Get('categories')
  getCategories() { return this.portfolio.getCategories(); }

  @Get('projects')
  getProjects(@Query() query: ProjectsQueryDto) { return this.portfolio.getProjects(query); }

  @Get('projects/:slug')
  getProject(@Param('slug') slug: string) { return this.portfolio.getProjectBySlug(slug); }
}
