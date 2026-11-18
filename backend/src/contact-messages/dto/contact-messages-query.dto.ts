import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const CONTACT_MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export class ContactMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @IsIn([...CONTACT_MESSAGE_STATUSES])
  status?: ContactMessageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class UpdateContactMessageStatusDto {
  @IsIn([...CONTACT_MESSAGE_STATUSES])
  status!: ContactMessageStatus;
}
