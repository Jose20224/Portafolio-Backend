import {
  Body,
  Controller,
  Delete,
  Get,
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
  ConfirmStorageUploadDto,
  CreateStorageUploadUrlDto,
  DeleteStorageObjectDto,
  StorageObjectsQueryDto,
} from './dto/storage.dto.js';
import { StorageService } from './storage.service.js';

@Controller('admin/storage')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('owner', 'editor')
@UseInterceptors(new NoStoreInterceptor())
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload-url')
  createUploadUrl(
    @Body() dto: CreateStorageUploadUrlDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.storage.createUploadUrl(dto, admin);
  }

  @Post('confirm-upload')
  confirmUpload(
    @Body() dto: ConfirmStorageUploadDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.storage.confirmUpload(dto.path, admin);
  }

  @Get('objects')
  listObjects(@Query() query: StorageObjectsQueryDto) {
    return this.storage.listObjects(query.folder, query.limit, query.offset);
  }

  @Delete('objects')
  deleteObject(
    @Body() dto: DeleteStorageObjectDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.storage.deleteObject(dto.path, admin);
  }
}
