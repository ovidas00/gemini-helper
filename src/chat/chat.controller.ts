import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  async chat(@Body() dto: ChatDto) {
    return this.chatService.chat(dto.message);
  }
}
