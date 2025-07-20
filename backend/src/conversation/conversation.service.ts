import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

  async getShareConversation(id: string) {
    return this.prismaService.conversations.findFirst({
      where: {
        shareId: id
      }
    })
  }

  async getConversation(id: number) {
    return this.prismaService.conversations.findUnique({
      where: {
        id
      }
    })
  }

  async share(id: number) {
    const uuid = randomUUID()
    await this.prismaService.conversations.update({
      data: {
        shareId: uuid
      },
      where: {
        id
      }
    })
    return `http://localhost:3000/digest/${uuid}`
  }
}
