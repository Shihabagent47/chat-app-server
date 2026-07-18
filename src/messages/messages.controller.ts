import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
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
import { MessagesService } from './messages.service';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MarkReadResponseDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ChatGateway } from '../chat/chat.gateway';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message retrieved successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a participant in this conversation' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    return this.messagesService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message updated successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'You can only edit your own messages' })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    const updated = await this.messagesService.update(id, updateMessageDto, user.id);
    this.chatGateway.broadcastMessageUpdated(updated.conversationId, updated);
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'You can only delete your own messages' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const result = await this.messagesService.remove(id, user.id);
    this.chatGateway.broadcastMessageDeleted(result.conversationId, result.messageId);
    return { message: result.message };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message marked as read successfully',
    type: MarkReadResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot mark your own messages as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<MarkReadResponseDto> {
    const result = await this.messagesService.markAsRead(id, user.id);
    if (result.conversationId && result.readAt) {
      this.chatGateway.broadcastMessageRead(result.conversationId, {
        messageId: id,
        userId: user.id,
        readAt: result.readAt,
      });
    }
    return result;
  }
}
