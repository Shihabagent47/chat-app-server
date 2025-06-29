import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConversationType } from '../entities/conversation.entity';

export class GetConversationsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of conversations per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ConversationType,
    description: 'Filter by conversation type',
  })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;
}
