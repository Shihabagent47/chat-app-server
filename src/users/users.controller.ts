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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePictureMulterConfig } from 'src/common/files/multer.config';
import { File } from 'multer';
import { FileUploadService } from '../common/files/fire-upload.service';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  async findAll(@Query() query: GetUsersQueryDto): Promise<any> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findOne(@Param('id') id: string): Promise<any> {
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
