import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class JoinConversationDto {
  @IsString()
  conversationId: string;
}

export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

  @IsEnum(['text', 'image', 'file', 'audio', 'video'])
  type: 'text' | 'image' | 'file' | 'audio' | 'video';

  @IsOptional()
  @IsString()
  replyToId?: string;
}

export class TypingDto {
  @IsString()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class MessageReadDto {
  @IsString()
  conversationId: string;

  @IsString()
  messageId: string;
}
