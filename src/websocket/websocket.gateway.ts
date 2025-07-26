// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { GetConversationsQueryDto } from 'src/conversations/dto/get-conversations-query.dto';
import { UpdateStatusDto } from 'src/users/dto/update-status.dto';
import { CallsService } from 'src/calls/calls.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface JoinRoomDto {
  conversationId: string;
}

interface SendMessageDto {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  replyToId?: string;
}

interface TypingDto {
  conversationId: string;
  isTyping: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, AuthenticatedSocket>(); // socketId -> socket

  constructor(
    private jwtService: JwtService,
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    @Inject(forwardRef(() => CallsService))
    private callsService: CallsService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake?.auth?.token ||
        client.handshake?.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid user`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = user.id;
      client.user = user;

      // Store connections
      this.connectedUsers.set(user.id, client.id);
      this.userSockets.set(client.id, client);

      // Update user status to online
      //await this.usersService.updateStatus(user.id, 'online');

      // Join user to their personal room (for direct notifications)
      await client.join(`user_${user.id}`);

      const getConversationsQueryDto: GetConversationsQueryDto = {
        page: 1,
        limit: 10,
      };
      // Get user's conversations and join those rooms
      const conversations = await this.conversationsService.findAll(
        getConversationsQueryDto,
        user.id,
      );
      await Promise.all(
        conversations.data.map(async (conv) => {
          await client.join(`conversation_${conv.id}`);
        }),
      );

      // Notify others that user is online
      client.broadcast.emit('user_status_change', {
        userId: user.id,
        status: 'online',
        lastSeen: new Date(),
      });

      this.logger.log(`Client ${client.id} connected: ${user.email}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Update user status to offline
      await this.usersService.updateStatus(
        client.userId,
        { isOnline: false },
      );

      // Remove from maps
      this.connectedUsers.delete(client.userId);
      this.userSockets.delete(client.id);

      // Notify others that user is offline
      client.broadcast.emit('user_status_change', {
        userId: client.userId,
        status: 'offline',
        lastSeen: new Date(),
      });

      this.logger.log(
        `Client ${client.id} disconnected: ${client.user?.email}`,
      );
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDto,
  ) {
    try {
      // Verify user has access to this conversation
      const hasAccess = true;
      //Todo : make a service for this
      // await this.conversationsService.userHasAccess(
      //         client.userId,
      //         data.conversationId,
      //       );


      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to conversation' });
        return;
      }

      // Join the conversation room
      client.join(`conversation_${data.conversationId}`);

      // Mark messages as read
      await this.messagesService.markAsRead(data.conversationId, client.userId || '');

      client.emit('joined_conversation', {
        conversationId: data.conversationId,
      });

      this.logger.log(
        `User ${client.userId} joined conversation ${data.conversationId}`,
      );
    } catch (error) {
      client.emit('error', { message: 'Failed to join conversation' });
      this.logger.error(`Join conversation error: ${error.message}`);
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDto,
  ) {
    await client.leave(`conversation_${data.conversationId}`);
    client.emit('left_conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      // Verify user has access to this conversation
      const hasAccess = true;

      //Todo : make a service for this
      // await this.conversationsService.userHasAccess(
      //   client.userId,
      //   data.conversationId,
      // );


      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to conversation' });
        return;
      }

      // Create message in database
      // const message = await this.messagesService.create({
      //   senderId: client.userId,
      //   conversationId: data.conversationId,
      //   content: data.content,
      //   type: data.type,
      //   replyToId: data.replyToId,
      // });

      // // Get populated message with sender info
      // const populatedMessage = await this.messagesService.findByIdWithSender(
      //   message.id,
      // );

      // Update conversation's last message
      // await this.conversationsService.updateLastMessage(
      //   data.conversationId,
      //   message.id,
      // );

      // Emit to all users in the conversation
      // this.server
      //   .to(`conversation_${data.conversationId}`)
      //   .emit('new_message', populatedMessage);

      // Send push notifications to offline users
      // const conversationUsers =
      //   await this.conversationsService.getConversationUsers(
      //     data.conversationId,
      //   );

      // const offlineUsers = conversationUsers.filter(
      //   (user) =>
      //     user.id !== client.userId && !this.connectedUsers.has(user.id),
      // );

      // TODO: Implement push notifications for offline users
      // await this.notificationsService.sendMessageNotifications(offlineUsers, message);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
      this.logger.error(`Send message error: ${error}`);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingDto,
  ) {
    // Broadcast typing status to others in the conversation
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
      user: {
        id: client.user.id,
        name: client.user.name,
      },
    });
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    try {
      await this.messagesService.markAsRead(
        data.conversationId,
        client.userId || '',
      );

      // Notify others that message was read
      client
        .to(`conversation_${data.conversationId}`)
        .emit('message_read_receipt', {
          messageId: data.messageId,
          readBy: client.userId,
          readAt: new Date(),
        });
    } catch (error) {
      this.logger.error(`Message read error: ${error.message}`);
    }
  }

  @SubscribeMessage('initiate_call')
  async handleInitiateCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      type: 'audio' | 'video';
      participantIds: string[];
    },
  ) {
    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.callsService.initiateCall(
        callId,
        data.conversationId,
        client.userId || '',
        data.type,
        data.participantIds,
      );

      client.emit('call_initiated', { callId });
    } catch (error) {
      client.emit('error', { message: 'Failed to initiate call' });
      this.logger.error(`Initiate call error: ${error}`);
    }
  }

  @SubscribeMessage('join_call')
  async handleJoinCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const success = await this.callsService.joinCall(
        data.callId,
        client.userId || '',
        client.id,
      );

      if (success) {
        client.join(`call_${data.callId}`);
        client.emit('call_joined', { callId: data.callId });
      } else {
        client.emit('error', { message: 'Failed to join call' });
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to join call' });
      this.logger.error(`Join call error: ${error.message}`);
    }
  }

  @SubscribeMessage('leave_call')
  async handleLeaveCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      await this.callsService.leaveCall(data.callId, client.userId || '');
      client.leave(`call_${data.callId}`);
      client.emit('call_left', { callId: data.callId });
    } catch (error) {
      this.logger.error(`Leave call error: ${error}`);
    }
  }

  @SubscribeMessage('webrtc_offer')
  async handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      callId: string;
      toUserId: string;
      offer: RTCSessionDescriptionInit;
    },
  ) {
    await this.callsService.handleSignalingMessage(
      data.callId,
      client.userId || '',
      data.toUserId,
      'offer',
      data.offer,
    );
  }

  @SubscribeMessage('webrtc_answer')
  async handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      callId: string;
      toUserId: string;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    await this.callsService.handleSignalingMessage(
      data.callId,
      client.userId || '',
      data.toUserId,
      'answer',
      data.answer,
    );
  }

  @SubscribeMessage('webrtc_ice_candidate')
  async handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      callId: string;
      toUserId: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    await this.callsService.handleSignalingMessage(
      data.callId,
      client.userId || '',
      data.toUserId,
      'ice-candidate',
      data.candidate,
    );
  }

  @SubscribeMessage('toggle_mute')
  async handleToggleMute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; muted: boolean },
  ) {
    await this.callsService.toggleMute(data.callId, '', data.muted);
  }

  @SubscribeMessage('toggle_video')
  async handleToggleVideo(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; videoEnabled: boolean },
  ) {
    await this.callsService.toggleVideo(
      data.callId,
      client.userId || '',
      data.videoEnabled,
    );
  }

  // Utility methods for other services to use
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.userSockets.get(socketId);
      socket?.emit(event, data);
      return true;
    }
    return false;
  }

  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation_${conversationId}`).emit(event, data);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
