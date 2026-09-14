import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GeminiService } from 'src/chat/gemini.service';
import { FacebookService } from './facebook.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly geminiService: GeminiService,
    private readonly facebookService: FacebookService,
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
    const event = data.entry?.[0]?.messaging?.[0];

    const senderId = event?.sender?.id;
    const message = event?.message?.text;

    if (!senderId || !message) {
      return {
        success: true,
        message: 'No message found',
      };
    }

    const response = await this.geminiService.chat(message, 'facebook');

    if (!response) {
      return {
        success: true,
        message: 'No response from Gemini',
      };
    }

    const responseMessage =
      typeof response === 'string' ? response : response.message;

    if (!responseMessage) {
      return {
        success: true,
        message: 'Empty response from Gemini',
      };
    }

    let parsedResponse: {
      message?: string;
      images?: string[];
    };

    try {
      parsedResponse = JSON.parse(responseMessage);
    } catch {
      parsedResponse = {
        message: responseMessage,
        images: [],
      };
    }

    if (parsedResponse.message) {
      await this.facebookService.sendMessage(senderId, parsedResponse.message);
    }

    for (const image of parsedResponse.images ?? []) {
      if (typeof image !== 'string' || !image.trim()) {
        continue;
      }

      await this.facebookService.sendImage(senderId, image);
    }

    return 'done';
  }
}
