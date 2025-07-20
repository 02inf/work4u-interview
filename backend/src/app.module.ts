import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [AiModule, ConfigModule.forRoot(), ConversationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
