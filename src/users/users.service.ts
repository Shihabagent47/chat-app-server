import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileUploadService } from '../common/files/fire-upload.service';
import { File } from 'multer';
import { ResponseUtil } from '../common/utils/response.util';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private fileUploadService: FileUploadService,
  ) { }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async findAll(query: GetUsersQueryDto) {
    const pageSize = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * pageSize;
    const whereCondition = query.q
      ? [
        {
          phone: Like(`%${query.q}%`),
        },
      ]
      : {};

    const [users, totalUsers] = await this.userRepository.findAndCount({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        about: true,
        profile_photo: true,
      },
      where: whereCondition,
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalUsers / pageSize);

    return ResponseUtil.successWithMeta(
      users,
      {
        page,
        limit: pageSize,
        total: totalUsers,
        pages: totalPages,
      },
      'Users retrieved successfully',
    );
  }

  async updateStatus(
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateStatusDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile picture if exists
    if (user.profile_photo) {
      await this.fileUploadService.deleteFile(user.profile_photo);
    }

    // Upload new profile picture
    const profilePictureUrl = await this.fileUploadService.uploadProfilePicture(
      userId,
      file,
      {
        resize: { width: 400, height: 400 }, // Resize to 400x400
        quality: 80,
      },
    );

    // Update user record
    user.profile_photo = profilePictureUrl;
    user.updatedAt = new Date();
    await this.userRepository.save(user);

    return profilePictureUrl;
  }

  async removeProfilePicture(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile_photo) {
      // Delete file from storage
      await this.fileUploadService.deleteFile(user.profile_photo);

      // Update user record
      user.profile_photo = '';
      user.updatedAt = new Date();
      await this.userRepository.save(user);
    }
  }
}
