import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    example: 'Updated message content',
    description: 'Updated content of the message',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  content: string;
}
