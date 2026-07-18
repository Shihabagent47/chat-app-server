import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { User } from '../users/entities/user.entity';
import { Participant } from '../users/entities/participants.entity';
import { jwtConstants } from '../shared/constants/jwt.constants';
import { MessageResponseDto } from '../messages/dto/message-response.dto';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // userId → set of socketIds (one user can have multiple tabs/devices)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth as any)?.token ||
        client.handshake.headers?.authorization;

      if (!raw) {
        client.disconnect();
        return;
      }

      const token = raw.replace(/^Bearer\s+/i, '');
      const payload = jwt.verify(
        token,
        jwtConstants.secret as string,
      ) as unknown as { sub: string; email: string };

      (client as AuthenticatedSocket).userId = payload.sub;

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      await this.userRepository.update(payload.sub, { isOnline: true });

      this.logger.log(`Connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);

      // Only mark offline when every device/tab disconnects
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        const lastSeen = new Date();
        await this.userRepository.update(userId, {
          isOnline: false,
          lastSeen,
        });
        this.server.emit('user_offline', { userId, lastSeen });
      }
    }

    this.logger.log(`Disconnected: ${client.id} (user: ${userId})`);
  }

  // Flutter emits this when the user opens a conversation screen
  @SubscribeMessage('join_conversation')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId: data.conversationId, userId: client.userId },
    });

    if (!participant) {
      client.emit('error', {
        message: 'Not a participant in this conversation',
      });
      return;
    }

    await client.join(`conversation:${data.conversationId}`);
  }

  // Flutter emits this when the user leaves a conversation screen
  @SubscribeMessage('leave_conversation')
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    await client.leave(`conversation:${data.conversationId}`);
  }

  // Flutter emits this while the user is typing
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
    });
  }

  // Flutter emits this when the user stops typing
  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('user_stop_typing', {
        userId: client.userId,
        conversationId: data.conversationId,
      });
  }

  // ─── Methods called by HTTP controllers after DB operations ───────────────

  broadcastNewMessage(conversationId: string, message: MessageResponseDto) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', message);
  }

  broadcastMessageUpdated(conversationId: string, message: MessageResponseDto) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message_updated', message);
  }

  broadcastMessageDeleted(conversationId: string, messageId: string) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message_deleted', { messageId, conversationId });
  }

  broadcastMessageRead(
    conversationId: string,
    data: { messageId: string; userId: string; readAt: Date | undefined },
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message_read', data);
  }
}
