import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users;
  }
}
