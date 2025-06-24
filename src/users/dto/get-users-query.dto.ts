import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search term for users' })
  @IsString()
  @IsOptional()
  q: string;

  @ApiPropertyOptional({ description: 'Number of results per page' })
  @IsNumber()
  @IsOptional()
  limit: number;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsNumber()
  @IsOptional()
  page: number;
}
