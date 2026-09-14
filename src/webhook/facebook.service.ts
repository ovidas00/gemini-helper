import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookService {
  private readonly accessToken: string;
  private readonly graphUrl = 'https://graph.facebook.com/v25.0';

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.getOrThrow<string>(
      'FACEBOOK_PAGE_ACCESS_TOKEN',
    );
  }

  async sendMessage(recipientId: string, message: string) {
    const response = await fetch(
      `${this.graphUrl}/me/messages?access_token=${this.accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: recipientId,
          },
          message: {
            text: message,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Facebook API error: ${JSON.stringify(data)}`);
    }

    return data;
  }
}
