import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/validate-environment.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { PublicPortfolioModule } from './public-portfolio/public-portfolio.module.js';
import { ContactMessagesModule } from './contact-messages/contact-messages.module.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    SupabaseModule,
    AuthModule,
    AdminModule,
    HealthModule,
    PublicPortfolioModule,
    ContactMessagesModule,
    StorageModule,
  ],
})
export class AppModule {}
