import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private readonly prismaService: PrismaService) {}
  async listConversation() {
    return this.prismaService.conversations.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
