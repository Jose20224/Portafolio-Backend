import { Module } from '@nestjs/common';
import { PublicPortfolioController } from './public-portfolio.controller.js';
import { PublicPortfolioService } from './public-portfolio.service.js';

@Module({ controllers: [PublicPortfolioController], providers: [PublicPortfolioService] })
export class PublicPortfolioModule {}
