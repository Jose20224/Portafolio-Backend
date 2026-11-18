import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { ContactMessagesService } from './contact-messages.service.js';

@Controller('contact')
export class PublicContactController {
  constructor(private readonly messages: ContactMessagesService) {}

  @Post('messages')
  @HttpCode(HttpStatus.ACCEPTED)
  submitMessage(@Body() dto: CreateContactMessageDto, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress || 'unknown';
    return this.messages.submitPublicMessage(dto, ipAddress);
  }
}
