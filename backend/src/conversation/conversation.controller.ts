import { Controller, Get, Param, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Get('list')
  async listConversation() {
    return this.service.listConversation()
  }

  @Get(':id/share')
  async getShareConversation(@Param('id') uuid: string) {
    return this.service.getShareConversation(uuid)
  }

  @Get(':id')
  async getConversation(@Param('id') id: number) {
    return this.service.getConversation(id)
  }

  @Post(':id/share')
  async share(@Param('id') id: number) {
    const link = await this.service.share(id)
    return {
      data: link
    }
  }
}
