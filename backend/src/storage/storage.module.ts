import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [StorageService, RolesGuard],
})
export class StorageModule {}
