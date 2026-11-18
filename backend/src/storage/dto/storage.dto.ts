import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const STORAGE_AREAS = ['profile', 'projects', 'collaborators'] as const;
export type StorageArea = (typeof STORAGE_AREAS)[number];

export const PORTFOLIO_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;
export type PortfolioImageMimeType = (typeof PORTFOLIO_IMAGE_TYPES)[number];

export class CreateStorageUploadUrlDto {
  @IsIn(STORAGE_AREAS)
  area!: StorageArea;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  fileName!: string;

  @IsIn(PORTFOLIO_IMAGE_TYPES)
  contentType!: PortfolioImageMimeType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8 * 1024 * 1024)
  size!: number;
}

export class ConfirmStorageUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  path!: string;
}

export class DeleteStorageObjectDto extends ConfirmStorageUploadDto {}

export class StorageObjectsQueryDto {
  @IsIn(STORAGE_AREAS)
  folder!: StorageArea;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  offset = 0;
}
