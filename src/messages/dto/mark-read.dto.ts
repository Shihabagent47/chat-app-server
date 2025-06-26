import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkReadResponseDto {
  @ApiPropertyOptional({ example: 'Message marked as read successfully' })
  message?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  readAt?: Date;
}
