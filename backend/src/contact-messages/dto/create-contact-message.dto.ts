import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactMessageDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Transform(trimString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(150)
  subject?: string | null;

  @Transform(trimString)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  /** Honeypot: genuine forms keep this field empty. */
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  website?: string;

  /** Unix timestamp in milliseconds captured when the form was opened. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9_999_999_999_999)
  formStartedAt?: number;
}
