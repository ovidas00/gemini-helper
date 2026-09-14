import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Injectable()
export class ChatService {
  constructor(private readonly gemini: GeminiService) {}

  async chat(message: string) {
    return this.gemini.chat(message);
  }
}
