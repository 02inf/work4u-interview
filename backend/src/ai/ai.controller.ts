import { Body, Controller, Post, Res } from '@nestjs/common';
import { GenerateRequest } from './ai.dto';
import { AiService } from './ai.service';
import { Response } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('generation')
  async generate(@Body() request: GenerateRequest, @Res() res: Response) {
    const stream = await this.service.generate(request)
    return stream.text
    // stream.pipeDataStreamToResponse(res)
  }
}
