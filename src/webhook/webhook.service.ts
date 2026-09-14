import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookService {
  constructor(private readonly config: ConfigService) {}

  verifyFacebookWebhook(mode: string, verifyToken: string, challenge: string) {
    const expectedToken = this.config.get<string>('FACEBOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      return challenge;
    }

    throw new ForbiddenException('Invalid verification token');
  }
}
