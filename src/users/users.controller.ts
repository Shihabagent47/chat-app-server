import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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

  @Put('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async updateStatus(
    @Request() req,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<any> {
    return this.userService.updateStatus(req.user.id, updateStatusDto);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<any> {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }
}
