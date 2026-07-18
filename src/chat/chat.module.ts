import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { User } from '../users/entities/user.entity';
import { Participant } from '../users/entities/participants.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Participant])],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
