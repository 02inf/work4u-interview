import { Controller, Get } from '@nestjs/common';
import { ConversationService } from './conversation.service';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Get('list')
  async listConversation() {
    return this.service.listConversation()
  }
}
