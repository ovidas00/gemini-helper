import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GeminiService } from 'src/chat/gemini.service';
import { FacebookService } from './facebook.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, GeminiService, FacebookService],
})
export class WebhookModule {}
