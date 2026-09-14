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
    return this.request({
      recipient: {
        id: recipientId,
      },
      message: {
        text: message,
      },
    });
  }

  async sendImage(recipientId: string, imageUrl: string) {
    return this.request({
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true,
          },
        },
      },
    });
  }

  private async request(body: any) {
    const response = await fetch(
      `${this.graphUrl}/me/messages?access_token=${this.accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Facebook API error: ${JSON.stringify(data)}`);
    }

    return data;
  }
}
