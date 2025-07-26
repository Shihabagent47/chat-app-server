import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dot';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcryptjs.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Update user with tokens
    await this.userRepository.update(user.id, {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    const userResponse = {
      id: user.id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      profile_photo: user.profile_photo,
    };

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userResponse,
    };
  }

  async logout(user: User): Promise<any> {
    await this.userRepository.update(user.id, {
      access_token: '',
      refresh_token: '',
    });
    return {
      message: 'Logout successful',
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Store original password before hashing
    const originalPassword = registerDto.password;
    const hashedPassword = await bcryptjs.hash(registerDto.password, 10);
    registerDto.password = hashedPassword;

    const user = this.userRepository.create(registerDto);
    await this.userRepository.save(user);

    const loginDto = {
      email: registerDto.email,
      password: originalPassword, // Use original password, not hashed
    };
    const loginUser = await this.login(loginDto);

    return loginUser;
  }

  async refreshToken(user: User): Promise<any> {
    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);
    await this.userRepository.update(user.id, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1m',
    });
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h', // Refresh tokens typically last longer
    });
  }
}
