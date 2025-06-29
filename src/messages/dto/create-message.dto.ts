import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    example: 'Hello, how are you doing today?',
    description: 'Content of the message',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  content: string;

  @ApiPropertyOptional({
    example: 'message-uuid-123',
    description: 'ID of the message this is replying to',
  })
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;
}
