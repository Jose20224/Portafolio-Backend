import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseBoolean(value: unknown): unknown {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return value;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  full_name?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  professional_title?: string;

  @IsOptional() @IsString() @MaxLength(160)
  hero_badge_text?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  hero_description?: string;

  @IsOptional() @IsString() @MaxLength(500)
  hero_image_path?: string | null;

  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  @MaxLength(500, { each: true })
  about_paragraphs?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  @MaxLength(160, { each: true })
  strengths?: string[];

  @IsOptional() @IsString() @MaxLength(120)
  location?: string | null;

  @IsOptional() @IsIn(['remote', 'hybrid', 'onsite', 'flexible'])
  work_mode?: 'remote' | 'hybrid' | 'onsite' | 'flexible';

  @IsOptional() @IsEmail() @MaxLength(254)
  contact_email?: string | null;

  @IsOptional() @IsIn(['available', 'open_to_opportunities', 'not_available'])
  availability_status?: 'available' | 'open_to_opportunities' | 'not_available';

  @IsOptional() @IsBoolean()
  is_public?: boolean;
}

export class CreateSocialLinkDto {
  @IsString() @IsNotEmpty() @MaxLength(60)
  platform!: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  label!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  url!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_visible?: boolean;
}

export class UpdateSocialLinkDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(60)
  platform?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  label?: string;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  url?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_visible?: boolean;
}

export class CreateSkillDto {
  @IsIn(['technical', 'tools', 'interests'])
  group_type!: 'technical' | 'tools' | 'interests';

  @IsString() @IsNotEmpty() @MaxLength(100)
  name!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  level?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_visible?: boolean;
}

export class UpdateSkillDto {
  @IsOptional() @IsIn(['technical', 'tools', 'interests'])
  group_type?: 'technical' | 'tools' | 'interests';

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  name?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  level?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_visible?: boolean;
}

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name!: string;

  @IsString() @IsNotEmpty() @MaxLength(100) @Matches(slugPattern)
  slug!: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  label!: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  name?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) @Matches(slugPattern)
  slug?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  label?: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}

export class CreateProjectDto {
  @IsUUID()
  category_id!: string;

  @IsString() @IsNotEmpty() @MaxLength(120) @Matches(slugPattern)
  slug!: string;

  @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @IsString() @MaxLength(500)
  short_description!: string;

  @IsString() @MaxLength(10000)
  full_description!: string;

  @IsOptional() @IsString() @MaxLength(500)
  card_image_path?: string | null;

  @IsOptional() @IsString() @MaxLength(500)
  cover_image_path?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  live_url?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  github_url?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100)
  year?: number | null;

  @IsOptional() @IsString() @MaxLength(120)
  role?: string | null;

  @IsOptional() @IsIn(['in_progress', 'completed', 'archived'])
  status?: 'in_progress' | 'completed' | 'archived';

  @IsOptional() @IsBoolean()
  is_featured?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class UpdateProjectDto {
  @IsOptional() @IsUUID()
  category_id?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) @Matches(slugPattern)
  slug?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160)
  title?: string;

  @IsOptional() @IsString() @MaxLength(500)
  short_description?: string;

  @IsOptional() @IsString() @MaxLength(10000)
  full_description?: string;

  @IsOptional() @IsString() @MaxLength(500)
  card_image_path?: string | null;

  @IsOptional() @IsString() @MaxLength(500)
  cover_image_path?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  live_url?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  github_url?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100)
  year?: number | null;

  @IsOptional() @IsString() @MaxLength(120)
  role?: string | null;

  @IsOptional() @IsIn(['in_progress', 'completed', 'archived'])
  status?: 'in_progress' | 'completed' | 'archived';

  @IsOptional() @IsBoolean()
  is_featured?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class AdminProjectsQueryDto {
  @IsOptional() @IsIn(['in_progress', 'completed', 'archived'])
  status?: 'in_progress' | 'completed' | 'archived';

  @IsOptional() @IsUUID()
  category_id?: string;

  @IsOptional() @Transform(({ value }) => parseBoolean(value)) @IsBoolean()
  is_published?: boolean;

  @IsOptional() @Transform(({ value }) => parseBoolean(value)) @IsBoolean()
  is_featured?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 20;
}

export class CreateTechnologyDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name!: string;

  @IsOptional() @IsString() @MaxLength(100)
  role?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class UpdateTechnologyDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  name?: string;

  @IsOptional() @IsString() @MaxLength(100)
  role?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class CreateHighlightDto {
  @IsString() @IsNotEmpty() @MaxLength(1000)
  content!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class UpdateHighlightDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(1000)
  content?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class CreateCollaboratorDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsOptional() @IsString() @MaxLength(120)
  role?: string | null;

  @IsOptional() @IsString() @MaxLength(500)
  avatar_path?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  github_url?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  linkedin_url?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}

export class UpdateCollaboratorDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @MaxLength(120)
  role?: string | null;

  @IsOptional() @IsString() @MaxLength(500)
  avatar_path?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  github_url?: string | null;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  linkedin_url?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  sort_order?: number;
}
