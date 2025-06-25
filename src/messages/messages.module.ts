import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Attachment } from './entities/attachment.entity';
import { MessageRead } from './entities/message_reads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Attachment, MessageRead])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
