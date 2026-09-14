import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GeminiService } from 'src/chat/gemini.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, GeminiService],
})
export class WebhookModule {}
