import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);
    registerDto.password = hashedPassword;
    const user = this.userRepository.create(registerDto);
    return this.userRepository.save(user);
  }
}
