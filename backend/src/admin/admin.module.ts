import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AdminPortfolioModule } from '../admin-portfolio/admin-portfolio.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [AuthModule, AdminPortfolioModule],
  controllers: [AdminController],
  providers: [RolesGuard],
})
export class AdminModule {}
