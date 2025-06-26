import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MarkReadResponseDto } from './dto/mark-read.dto';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message_reads.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Participant } from '../users/entities/participants.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageRead)
    private messageReadRepository: Repository<MessageRead>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  async createMessage(
    conversationId: string,
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<MessageResponseDto> {
    // Verify conversation exists and user is a participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // If replying to a message, verify it exists and is in the same conversation
    if (createMessageDto.replyToMessageId) {
      const replyToMessage = await this.messageRepository.findOne({
        where: {
          id: createMessageDto.replyToMessageId,
          conversationId: conversationId,
        },
      });

      if (!replyToMessage) {
        throw new BadRequestException(
          'Reply message not found in this conversation',
        );
      }
    }

    // Create the message
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
      conversationId,
    });

    const savedMessage = await this.messageRepository.save(message);

    return this.findOne(savedMessage.id, senderId);
  }

  async findMessagesInConversation(
    conversationId: string,
    query: GetMessagesQueryDto,
    currentUserId: string,
  ): Promise<{
    data: MessageResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    // Verify user is a participant in the conversation
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId: currentUserId },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Get messages with all related data
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyToMessage', 'replyToMessage')
      .leftJoinAndSelect('replyToMessage.sender', 'replyToMessageSender')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .leftJoinAndSelect('message.messageReads', 'messageRead')
      .leftJoinAndSelect('messageRead.user', 'readUser')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    const data = messages.map((message) => this.mapToResponseDto(message));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    currentUserId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyToMessage', 'replyToMessage')
      .leftJoinAndSelect('replyToMessage.sender', 'replyToMessageSender')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .leftJoinAndSelect('message.messageReads', 'messageRead')
      .leftJoinAndSelect('messageRead.user', 'readUser')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .where('message.id = :id', { id })
      .getOne();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return this.mapToResponseDto(message);
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    currentUserId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the sender can edit their message
    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Check if user is still a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Update message content and mark as edited
    message.content = updateMessageDto.content;
    message.isEdited = true;
    message.updatedAt = new Date();

    await this.messageRepository.save(message);

    return this.findOne(id, currentUserId);
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the sender can delete their message
    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Check if user is still a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Soft delete - mark as deleted instead of removing from database
    message.isDeleted = true;
    message.updatedAt = new Date();

    await this.messageRepository.save(message);

    return { message: 'Message deleted successfully' };
  }

  async markAsRead(
    messageId: string,
    currentUserId: string,
  ): Promise<MarkReadResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Don't allow marking own messages as read
    if (message.senderId === currentUserId) {
      throw new BadRequestException(
        'You cannot mark your own messages as read',
      );
    }

    // Check if already marked as read
    const existingRead = await this.messageReadRepository.findOne({
      where: { messageId, userId: currentUserId },
    });

    if (existingRead) {
      return {
        message: 'Message already marked as read',
        readAt: existingRead.readAt,
      };
    }

    // Create new read record
    const messageRead = this.messageReadRepository.create({
      messageId,
      userId: currentUserId,
    });

    const savedRead = await this.messageReadRepository.save(messageRead);

    return {
      message: 'Message marked as read successfully',
      readAt: savedRead.readAt,
    };
  }

  private mapToResponseDto(message: Message): MessageResponseDto {
    const response: MessageResponseDto = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      conversationId: message.conversationId,
      replyToMessageId: message.replyToMessageId,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    // Add sender info if available
    if (message.sender) {
      response.sender = {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profile_photo: message.sender.profile_photo,
        isOnline: message.sender.isOnline,
      };
    }

    // Add reply message info if available
    if (message.replyToMessage) {
      response.replyToMessage = {
        id: message.replyToMessage.id,
        content: message.replyToMessage.content,
        senderId: message.replyToMessage.senderId,
        sender: message.replyToMessage.sender
          ? {
              firstName: message.replyToMessage.sender.firstName,
              lastName: message.replyToMessage.sender.lastName,
            }
          : undefined,
      };
    }

    // Add attachments if available
    if (message.attachments && message.attachments.length > 0) {
      response.attachments = message.attachments.map((attachment) => ({
        id: attachment.id,
        url: attachment.url,
        type: attachment.type,
        size: attachment.size,
        name: attachment.name,
        thumbnailUrl: attachment.thumbnailUrl,
        createdAt: attachment.createdAt,
      }));
    }

    // Add message reads if available
    if (message.messageReads && message.messageReads.length > 0) {
      response.messageReads = message.messageReads.map((read) => ({
        id: read.id,
        userId: read.userId,
        readAt: read.readAt,
        user: read.user
          ? {
              id: read.user.id,
              firstName: read.user.firstName,
              lastName: read.user.lastName,
              profile_photo: read.user.profile_photo,
            }
          : undefined,
      }));
      response.readCount = message.messageReads.length;
    } else {
      response.readCount = 0;
    }

    return response;
  }
}
