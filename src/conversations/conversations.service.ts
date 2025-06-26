import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { GetConversationsQueryDto } from './dto/get-conversations-query.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { Conversation, ConversationType } from './entities/conversation.entity';
import {
  Participant,
  ParticipantRole,
} from '../users/entities/participants.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    const { participantIds, ...conversationData } = createConversationDto;

    // Validate that all participant IDs exist and are unique
    const uniqueParticipantIds = [...new Set(participantIds)];
    if (uniqueParticipantIds.length !== participantIds.length) {
      throw new BadRequestException(
        'Duplicate participant IDs are not allowed',
      );
    }

    // Check if current user is trying to add themselves
    if (participantIds.includes(currentUserId)) {
      throw new BadRequestException('You cannot add yourself as a participant');
    }

    const users = await this.userRepository.find({
      where: { id: In([...uniqueParticipantIds, currentUserId]) },
    });

    if (users.length !== uniqueParticipantIds.length + 1) {
      throw new BadRequestException('One or more participant IDs are invalid');
    }

    // For direct conversations, ensure only 2 participants total (including creator)
    if (conversationData.type === ConversationType.DIRECT) {
      if (uniqueParticipantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversations must have exactly 2 participants',
        );
      }

      // Check if direct conversation already exists between these users
      const existingConversation =
        await this.findDirectConversationBetweenUsers(
          currentUserId,
          uniqueParticipantIds[0],
        );

      if (existingConversation) {
        throw new ConflictException(
          'Direct conversation already exists between these users',
        );
      }

      // For direct conversations, set name to participant names if not provided
      if (!conversationData.name || conversationData.name.trim() === '') {
        const otherUser = users.find((u) => u.id === uniqueParticipantIds[0]);
        if (otherUser) {
          conversationData.name = `${otherUser.firstName} ${otherUser.lastName}`;
        }
      }
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      ...conversationData,
      createdBy: currentUserId,
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Create participants
    const participants = [
      // Add creator as admin
      this.participantRepository.create({
        conversationId: savedConversation.id,
        userId: currentUserId,
        role: ParticipantRole.ADMIN,
      }),
      // Add other participants
      ...uniqueParticipantIds.map((userId) =>
        this.participantRepository.create({
          conversationId: savedConversation.id,
          userId,
          role: ParticipantRole.MEMBER,
        }),
      ),
    ];

    await this.participantRepository.save(participants);

    return this.findOne(savedConversation.id, currentUserId);
  }

  async findAll(
    query: GetConversationsQueryDto,
    currentUserId: string,
  ): Promise<{
    data: ConversationResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { page = 1, limit = 10, type } = query;
    const skip = (page - 1) * limit;

    // Build query to find conversations where user is a participant
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'participantUser')
      .leftJoinAndSelect('conversation.creator', 'creator')
      .leftJoin('conversation.messages', 'message')
      .leftJoinAndSelect(
        'conversation.messages',
        'lastMessage',
        'lastMessage.id = (SELECT m.id FROM message m WHERE m.conversationId = conversation.id ORDER BY m.createdAt DESC LIMIT 1)',
      )
      .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
      .where(
        'EXISTS (SELECT 1 FROM participant p WHERE p.conversationId = conversation.id AND p.userId = :userId)',
        { userId: currentUserId },
      );

    if (type) {
      queryBuilder.andWhere('conversation.type = :type', { type });
    }

    queryBuilder
      .orderBy(
        'COALESCE(lastMessage.createdAt, conversation.createdAt)',
        'DESC',
      )
      .skip(skip)
      .take(limit);

    const [conversations, total] = await queryBuilder.getManyAndCount();

    const data = conversations.map((conversation) =>
      this.mapToResponseDto(conversation, currentUserId),
    );

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
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'participantUser')
      .leftJoinAndSelect('conversation.creator', 'creator')
      .leftJoin('conversation.messages', 'message')
      .leftJoinAndSelect(
        'conversation.messages',
        'lastMessage',
        'lastMessage.id = (SELECT m.id FROM message m WHERE m.conversationId = conversation.id ORDER BY m.createdAt DESC LIMIT 1)',
      )
      .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
      .where('conversation.id = :id', { id })
      .getOne();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === currentUserId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return this.mapToResponseDto(conversation, currentUserId);
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is a participant and has admin role
    const userParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId,
    );
    if (!userParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    if (userParticipant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can update conversation details',
      );
    }

    // Update conversation
    Object.assign(conversation, updateConversationDto);
    await this.conversationRepository.save(conversation);

    return this.findOne(id, currentUserId);
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is the creator or admin
    const userParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId,
    );
    if (!userParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    if (
      conversation.createdBy !== currentUserId &&
      userParticipant.role !== ParticipantRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the creator or admins can delete the conversation',
      );
    }

    // Delete conversation (cascade will handle participants and messages)
    await this.conversationRepository.remove(conversation);

    return { message: 'Conversation deleted successfully' };
  }

  async addParticipant(
    conversationId: string,
    addParticipantDto: AddParticipantDto,
    currentUserId: string,
  ): Promise<ConversationResponseDto> {
    const { userId, role = ParticipantRole.MEMBER } = addParticipantDto;

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if current user is a participant and has admin role
    const currentUserParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId,
    );
    if (!currentUserParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    if (currentUserParticipant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can add participants');
    }

    // Check if user to be added exists
    const userToAdd = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!userToAdd) {
      throw new BadRequestException('User not found');
    }

    // Check if user is already a participant
    const existingParticipant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (existingParticipant) {
      throw new ConflictException(
        'User is already a participant in this conversation',
      );
    }

    // For direct conversations, don't allow adding more participants
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot add participants to direct conversations',
      );
    }

    // Create new participant
    const participant = this.participantRepository.create({
      conversationId,
      userId,
      role,
    });

    await this.participantRepository.save(participant);

    return this.findOne(conversationId, currentUserId);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    currentUserId: string,
  ): Promise<ConversationResponseDto | { message: string }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if current user is a participant
    const currentUserParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId,
    );
    if (!currentUserParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Find participant to remove
    const participantToRemove = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!participantToRemove) {
      throw new NotFoundException(
        'User is not a participant in this conversation',
      );
    }

    // Check permissions: admins can remove anyone, users can only remove themselves
    if (
      currentUserParticipant.role !== ParticipantRole.ADMIN &&
      currentUserId !== userId
    ) {
      throw new ForbiddenException(
        'You can only remove yourself or you must be an admin',
      );
    }

    // Don't allow removing the creator unless they're removing themselves
    if (conversation.createdBy === userId && currentUserId !== userId) {
      throw new ForbiddenException('Cannot remove the conversation creator');
    }

    // For direct conversations, removing a participant effectively deletes the conversation
    if (conversation.type === ConversationType.DIRECT) {
      await this.conversationRepository.remove(conversation);
      return { message: 'Direct conversation deleted' } as any;
    }

    // Remove participant
    await this.participantRepository.remove(participantToRemove);

    return this.findOne(conversationId, currentUserId);
  }

  private async findDirectConversationBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<Conversation | null> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.userId = :userId1', {
        userId1,
      })
      .innerJoin('conversation.participants', 'p2', 'p2.userId = :userId2', {
        userId2,
      })
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .getOne();
  }

  private mapToResponseDto(
    conversation: Conversation,
    currentUserId: string,
  ): ConversationResponseDto {
    const response: ConversationResponseDto = {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      description: conversation.description,
      photo: conversation.photo,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    // Add creator info if available
    if (conversation.creator) {
      response.creator = {
        id: conversation.creator.id,
        firstName: conversation.creator.firstName,
        lastName: conversation.creator.lastName,
        email: conversation.creator.email,
        profile_photo: conversation.creator.profile_photo,
      };
    }

    // Add participants info if available
    if (conversation.participants) {
      response.participants = conversation.participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        role: participant.role,
        isBlocked: participant.isBlocked,
        createdAt: participant.createdAt,
        user: participant.user
          ? {
              id: participant.user.id,
              firstName: participant.user.firstName,
              lastName: participant.user.lastName,
              email: participant.user.email,
              profile_photo: participant.user.profile_photo,
              isOnline: participant.user.isOnline,
              lastSeen: participant.user.lastSeen,
            }
          : undefined,
      }));
    }

    // Add last message info if available
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[0]; // Should be the latest due to our query
      response.lastMessage = {
        id: lastMessage.id,
        content: lastMessage.content,
        senderId: lastMessage.senderId,
        createdAt: lastMessage.createdAt,
        sender: lastMessage.sender
          ? {
              firstName: lastMessage.sender.firstName,
              lastName: lastMessage.sender.lastName,
            }
          : undefined,
      };
    }

    // TODO: Calculate unread count for the current user
    // This would require joining with MessageRead table
    response.unreadCount = 0;

    return response;
  }
}
