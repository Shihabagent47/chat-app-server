import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private websocketGateway: ChatGateway
  ) { }

  // Send message to specific user
  async sendToUser(userId: string, event: string, data: any): Promise<boolean> {
    return this.websocketGateway.sendToUser(userId, event, data);
  }

  // Send message to all users in a conversation
  async sendToConversation(
    conversationId: string,
    event: string,
    data: any,
  ): Promise<void> {
    return this.websocketGateway.sendToConversation(
      conversationId,
      event,
      data,
    );
  }

  // Get list of online users
  getOnlineUsers(): string[] {
    return this.websocketGateway.getConnectedUsers();
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.websocketGateway.isUserOnline(userId);
  }

  // Send typing notification
  async sendTypingNotification(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) {
    return this.websocketGateway.sendToConversation(
      conversationId,
      'user_typing',
      {
        userId,
        isTyping,
        timestamp: new Date(),
      },
    );
  }

  // Send new message notification
  async sendNewMessageNotification(conversationId: string, message: any) {
    return this.websocketGateway.sendToConversation(
      conversationId,
      'new_message',
      message,
    );
  }

  // Send user status change
  async sendUserStatusChange(
    userId: string,
    status: 'online' | 'offline' | 'away',
  ) {
    // Send to all conversations this user is part of
    // This would require getting user's conversations first
    return this.websocketGateway.sendToUser(userId, 'status_change', {
      userId,
      status,
      timestamp: new Date(),
    });
  }
}
