import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AdminContactMessagesController } from './admin-contact-messages.controller.js';
import { ContactMessagesService } from './contact-messages.service.js';
import { ContactRateLimitService } from './contact-rate-limit.service.js';
import { PublicContactController } from './public-contact.controller.js';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [PublicContactController, AdminContactMessagesController],
  providers: [ContactMessagesService, ContactRateLimitService, RolesGuard],
})
export class ContactMessagesModule {}
