import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty({ example: 'attachment-uuid-123' })
  id: string;

  @ApiProperty({ example: 'https://example.com/file.pdf' })
  url: string;

  @ApiProperty({ example: 'application/pdf' })
  type: string;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: 'document.pdf' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class MessageReadResponseDto {
  @ApiProperty({ example: 'read-uuid-123' })
  id: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  readAt: Date;

  @ApiPropertyOptional()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profile_photo?: string;
  };
}

export class MessageResponseDto {
  @ApiProperty({ example: 'message-uuid-123' })
  id: string;

  @ApiProperty({ example: 'user-uuid-123' })
  senderId: string;

  @ApiProperty({ example: 'Hello, how are you doing today?' })
  content: string;

  @ApiProperty({ example: 'conversation-uuid-123' })
  conversationId: string;

  @ApiPropertyOptional({ example: 'message-uuid-456' })
  replyToMessageId?: string;

  @ApiProperty({ example: false })
  isEdited: boolean;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional()
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profile_photo?: string;
    isOnline: boolean;
  };

  @ApiPropertyOptional()
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    sender?: {
      firstName: string;
      lastName: string;
    };
  };

  @ApiPropertyOptional({ type: [AttachmentResponseDto] })
  attachments?: AttachmentResponseDto[];

  @ApiPropertyOptional({ type: [MessageReadResponseDto] })
  messageReads?: MessageReadResponseDto[];

  @ApiPropertyOptional({ example: 3 })
  readCount?: number;
}
