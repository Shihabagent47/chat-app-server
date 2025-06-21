import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }
}
