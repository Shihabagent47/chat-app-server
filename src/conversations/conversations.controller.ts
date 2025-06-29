import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { GetConversationsQueryDto } from './dto/get-conversations-query.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { GetMessagesQueryDto } from '../messages/dto/get-messages-query.dto';
import { MessageResponseDto } from '../messages/dto/message-response.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Direct conversation already exists between users',
  })
  async create(
    @Body() createConversationDto: CreateConversationDto,
    @CurrentUser() user: User,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.create(createConversationDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get user conversations with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    type: ApiResponseDto<ConversationResponseDto[]>,
  })
  async findAll(
    @Query() query: GetConversationsQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: ConversationResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.conversationsService.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not a participant in this conversation',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update conversation details' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation updated successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admins can update conversation details',
  })
  async update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @CurrentUser() user: User,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.update(id, updateConversationDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only creator or admins can delete the conversation',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.conversationsService.remove(id, user.id);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add a participant to the conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Participant added successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation or user not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admins can add participants',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a participant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot add participants to direct conversations',
  })
  async addParticipant(
    @Param('id') conversationId: string,
    @Body() addParticipantDto: AddParticipantDto,
    @CurrentUser() user: User,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.addParticipant(
      conversationId,
      addParticipantDto,
      user.id,
    );
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Remove a participant from the conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant removed successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation or participant not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to remove participant',
  })
  async removeParticipant(
    @Param('id') conversationId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<ConversationResponseDto | { message: string }> {
    return this.conversationsService.removeParticipant(
      conversationId,
      userId,
      user.id,
    );
  }

  // Message endpoints within conversations
  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: ApiResponseDto<MessageResponseDto[]>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not a participant in this conversation',
  })
  async getMessages(
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: MessageResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.messagesService.findMessagesInConversation(
      conversationId,
      query,
      user.id,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not a participant in this conversation',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message data or reply message not found',
  })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    return this.messagesService.createMessage(
      conversationId,
      createMessageDto,
      user.id,
    );
  }
}
