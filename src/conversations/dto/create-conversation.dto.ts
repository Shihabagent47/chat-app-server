import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @ApiProperty({
    example: 'Team Discussion',
    description: 'Name of the conversation',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: ConversationType,
    example: ConversationType.GROUP,
    description: 'Type of conversation - group or direct',
  })
  @IsNotEmpty()
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    example: 'Discussion about project updates and planning',
    description: 'Description of the conversation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/photo.jpg',
    description: 'URL of the conversation photo',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    type: [String],
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'Array of user IDs to add as participants',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  participantIds: string[];
}
