import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePictureMulterConfig } from '../common/files/multer.config';
import { File } from 'multer';
import { FileUploadService } from '../common/files/fire-upload.service';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { User } from './entities/user.entity';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Get('')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: ApiResponseDto<User[]>,
  })
  async findAll(
    @Query() query: GetUsersQueryDto,
  ): Promise<ApiResponseDto<User[]>> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get single user by id' })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: ApiResponseDto<User>,
  })
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
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

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', profilePictureMulterConfig))
  async uploadProfilePicture(@Request() req, @UploadedFile() file: File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Update user record

    const profilePictureUrl = await this.userService.uploadProfilePicture(
      req.user.id,
      file,
    );

    return {
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
    };
  }
}
