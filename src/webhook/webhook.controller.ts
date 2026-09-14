import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

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
  handleFacebookWebhook(@Body() data) {
    console.log(data);
  }
}
