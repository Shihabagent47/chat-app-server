import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findAll(@Query() query: GetUsersQueryDto): Promise<any> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.userService.findOne(id);
  }
}
