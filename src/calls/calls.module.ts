import { Module, forwardRef } from '@nestjs/common';
import { CallsService } from './calls.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { UsersModule } from '../users/users.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { CallsController } from './calls.controller';

@Module({
  imports: [forwardRef(() => WebSocketModule), UsersModule, ConversationsModule],
  providers: [CallsService],
  controllers: [CallsController],
  exports: [CallsService],
})
export class CallsModule { }
