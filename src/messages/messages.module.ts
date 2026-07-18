import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Attachment } from './entities/attachment.entity';
import { MessageRead } from './entities/message_reads.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Participant } from '../users/entities/participants.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Attachment,
      MessageRead,
      Conversation,
      Participant,
    ]),
    ChatModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
