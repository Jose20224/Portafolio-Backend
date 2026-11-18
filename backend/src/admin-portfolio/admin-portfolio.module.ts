import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AdminPortfolioController } from './admin-portfolio.controller.js';
import { AdminPortfolioService } from './admin-portfolio.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminPortfolioController],
  providers: [AdminPortfolioService, RolesGuard],
})
export class AdminPortfolioModule {}
