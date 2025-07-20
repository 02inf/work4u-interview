import { createDeepSeek, deepseek, DeepSeekProvider } from '@ai-sdk/deepseek';
import { Injectable } from '@nestjs/common';
import { generateObject, generateText, streamText } from 'ai';
import { GenerateRequest } from './ai.dto';
import { openai } from '@ai-sdk/openai';
import { createQwen, qwen } from 'qwen-ai-provider';
import { PrismaService } from 'src/prisma.service';
import z from 'zod';

@Injectable()
export class AiService {
  constructor(private readonly prismaService: PrismaService) {}
  async generate({ input }: GenerateRequest) {
    const { object } = await generateObject({
      model: createQwen({
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      }).languageModel('qwen-plus'),
      schema: z.object({
        summary: z.string(),
        decisions: z.array(z.string()),
        actions: z.array(z.object({
          thing: z.string(),
          assignee: z.string()
        }))
      }),
      system: `As a professional meeting recorder, you need to read whole meeting transcript, then do below things
      1. Summary for whole meeting transcript, output a brief, one-paragraph overview of the meeting
      2. Depends on transcript, output a bulleted list of the key decisions made.
      3. Depends on transcript, output a bulleted list of the action items assigned, and to whom.
      `,
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
        parsedOutput: JSON.stringify(object),
        title: ''
      }
    })
    return object
  }
}
