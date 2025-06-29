import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateConversationDto {
  @ApiPropertyOptional({
    example: 'Updated Team Discussion',
    description: 'Updated name of the conversation',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated discussion about project updates and planning',
    description: 'Updated description of the conversation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/updated-photo.jpg',
    description: 'Updated URL of the conversation photo',
  })
  @IsOptional()
  @IsString()
  photo?: string;
}
