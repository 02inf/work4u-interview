import { createDeepSeek, deepseek, DeepSeekProvider } from '@ai-sdk/deepseek';
import { Injectable } from '@nestjs/common';
import { generateText, streamText } from 'ai';
import { GenerateRequest } from './ai.dto';
import { openai } from '@ai-sdk/openai';
import { createQwen, qwen } from 'qwen-ai-provider';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prismaService: PrismaService) {}
  async generate({ input }: GenerateRequest) {
    const { text } = await generateText({
      model: createQwen({
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      }).languageModel('qwen-plus'),
      system: 'summary input into a list',
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    });
    await this.prismaService.conversations.create({
      data: {
        originalInput: input,
        parsedOutput: text,
        title: ''
      }
    })
    return text
  }
}
