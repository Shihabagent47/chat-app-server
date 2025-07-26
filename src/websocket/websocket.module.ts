import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './websocket.gateway';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { UsersModule } from '../users/users.module';
import { WebSocketService } from './websocket.service';
import { CallsModule } from '../calls/calls.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    ConversationsModule,
    MessagesModule,
    UsersModule,
    forwardRef(() => CallsModule),
  ],
  providers: [ChatGateway, WebSocketService],
  exports: [ChatGateway, WebSocketService],
})
export class WebSocketModule { }
