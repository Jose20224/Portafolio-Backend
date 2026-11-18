import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
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
import { ContactMessagesService } from './contact-messages.service.js';
import { ContactMessagesQueryDto, UpdateContactMessageStatusDto } from './dto/contact-messages-query.dto.js';

@Controller('admin/contact-messages')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('owner', 'editor')
@UseInterceptors(new NoStoreInterceptor())
export class AdminContactMessagesController {
  constructor(private readonly messages: ContactMessagesService) {}

  @Get('stats')
  getStats() {
    return this.messages.getStats();
  }

  @Get()
  listMessages(@Query() query: ContactMessagesQueryDto) {
    return this.messages.listMessages(query);
  }

  @Get(':id')
  getMessage(@Param('id', ParseUUIDPipe) id: string) {
    return this.messages.getMessage(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactMessageStatusDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.messages.updateStatus(id, dto.status, admin);
  }
}
