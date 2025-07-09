import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { Conversation } from './entities/conversation.entity';
import { Participant } from '../users/entities/participants.entity';
import { User } from '../users/entities/user.entity';
import { MessagesModule } from '../messages/messages.module';
import { Message } from 'src/messages/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Participant, User, Message]),
    MessagesModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
