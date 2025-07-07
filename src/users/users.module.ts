import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Participant } from './entities/participants.entity';
import { FileUploadService } from '../common/files/fire-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Participant])],
  controllers: [UsersController],
  providers: [UsersService, FileUploadService],
  exports: [UsersService, FileUploadService],
})
export class UsersModule {}
