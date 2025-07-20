import { createDeepSeek, deepseek, DeepSeekProvider } from '@ai-sdk/deepseek';
import { Injectable } from '@nestjs/common';
import { generateText, streamText } from 'ai';
import { GenerateRequest } from './ai.dto';
import { openai } from '@ai-sdk/openai';
import { createQwen, qwen } from 'qwen-ai-provider';

@Injectable()
export class AiService {
  constructor() {}
  async generate({ input }: GenerateRequest) {
    return generateText({
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
  }
}
