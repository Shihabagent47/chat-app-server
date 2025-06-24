import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async findAll(query: GetUsersQueryDto): Promise<any> {
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
      },
      where: whereCondition,
      skip: skip,
      take: pageSize,
    });
    const totalPages = Math.ceil(totalUsers / pageSize);
    return { page, totalUsers, pageSize, totalPages, data: users };
  }

  async updateStatus(
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<any> {
    const user = await this.findOne(userId);
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
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }


}
