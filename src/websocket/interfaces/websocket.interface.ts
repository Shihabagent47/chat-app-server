export interface ConnectedUser {
  userId: string;
  socketId: string;
  joinedAt: Date;
  lastActivity: Date;
}

export interface MessageEvent {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

export interface MessageReadEvent {
  messageId: string;
  conversationId: string;
  readBy: string;
  readAt: Date;
}
