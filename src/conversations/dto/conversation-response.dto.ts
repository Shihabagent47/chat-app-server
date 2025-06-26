import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '../entities/conversation.entity';
import { ParticipantRole } from '../../users/entities/participants.entity';

export class ParticipantResponseDto {
  @ApiProperty({ example: 'participant-uuid-123' })
  id: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ enum: ParticipantRole, example: ParticipantRole.MEMBER })
  role: ParticipantRole;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile_photo?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
}

export class ConversationResponseDto {
  @ApiProperty({ example: 'conversation-uuid-123' })
  id: string;

  @ApiProperty({ example: 'Team Discussion' })
  name: string;

  @ApiProperty({ enum: ConversationType, example: ConversationType.GROUP })
  type: ConversationType;

  @ApiPropertyOptional({ example: 'Discussion about project updates' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  photo?: string;

  @ApiProperty({ example: 'user-uuid-123' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ParticipantResponseDto] })
  participants?: ParticipantResponseDto[];

  @ApiPropertyOptional()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile_photo?: string;
  };

  @ApiPropertyOptional()
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender?: {
      firstName: string;
      lastName: string;
    };
  };

  @ApiPropertyOptional({ example: 5 })
  unreadCount?: number;
}
