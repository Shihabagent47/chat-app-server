import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const options = configService.get<TypeOrmModuleOptions>('database');
        if (!options) {
          throw new Error('Database configuration is missing');
        }
        return options;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
