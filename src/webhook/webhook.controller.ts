import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GeminiService } from 'src/chat/gemini.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('facebook')
  verifyFacebookWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.webhookService.verifyFacebookWebhook(
      mode,
      verifyToken,
      challenge,
    );
  }

  @Post('facebook')
  async handleFacebookWebhook(@Body() data: any) {
    const message = data.entry?.[0]?.messaging?.[0]?.message?.text;

    if (!message) {
      return {
        success: true,
        message: 'No message text found',
      };
    }

    const response = await this.geminiService.chat(message);
    console.log(response);

    return 'done';
  }
}
