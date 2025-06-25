# Entity Usage Examples

This document provides examples of how to use the TypeORM entity relationships in your services.

## Basic Queries with Relationships

### Finding a User with Their Conversations

```typescript
// In your service
async findUserWithConversations(userId: string) {
  return await this.userRepository.findOne({
    where: { id: userId },
    relations: ['participations', 'participations.conversation']
  });
}
```

### Finding a Conversation with Messages and Participants

```typescript
async findConversationWithDetails(conversationId: string) {
  return await this.conversationRepository.findOne({
    where: { id: conversationId },
    relations: [
      'messages',
      'messages.sender',
      'messages.attachments',
      'participants',
      'participants.user'
    ],
    order: {
      messages: {
        createdAt: 'ASC'
      }
    }
  });
}
```

### Finding Messages with Read Status

```typescript
async findMessagesWithReadStatus(conversationId: string, userId: string) {
  return await this.messageRepository.find({
    where: { conversationId },
    relations: ['sender', 'messageReads', 'messageReads.user', 'attachments'],
    order: { createdAt: 'ASC' }
  });
}
```

## Creating Related Entities

### Creating a Message with Attachments

```typescript
async createMessageWithAttachments(
  senderId: string,
  conversationId: string,
  content: string,
  attachmentFiles: Express.Multer.File[]
) {
  // Create the message
  const message = this.messageRepository.create({
    senderId,
    conversationId,
    content
  });
  
  const savedMessage = await this.messageRepository.save(message);
  
  // Create attachments if any
  if (attachmentFiles?.length > 0) {
    const attachments = attachmentFiles.map(file => 
      this.attachmentRepository.create({
        messageId: savedMessage.id,
        url: file.path,
        type: file.mimetype,
        size: file.size,
        name: file.originalname
      })
    );
    
    await this.attachmentRepository.save(attachments);
  }
  
  // Return message with attachments
  return await this.messageRepository.findOne({
    where: { id: savedMessage.id },
    relations: ['attachments', 'sender']
  });
}
```

### Adding a User to a Conversation

```typescript
async addUserToConversation(
  userId: string,
  conversationId: string,
  role: ParticipantRole = ParticipantRole.MEMBER
) {
  const participant = this.participantRepository.create({
    userId,
    conversationId,
    role
  });
  
  return await this.participantRepository.save(participant);
}
```

### Marking a Message as Read

```typescript
async markMessageAsRead(messageId: string, userId: string) {
  // Check if already read
  const existingRead = await this.messageReadRepository.findOne({
    where: { messageId, userId }
  });
  
  if (existingRead) {
    return existingRead;
  }
  
  // Create new read record
  const messageRead = this.messageReadRepository.create({
    messageId,
    userId
  });
  
  return await this.messageReadRepository.save(messageRead);
}
```

## Advanced Queries

### Finding Unread Messages for a User

```typescript
async findUnreadMessages(userId: string, conversationId: string) {
  return await this.messageRepository
    .createQueryBuilder('message')
    .leftJoin('message.messageReads', 'read', 'read.userId = :userId', { userId })
    .where('message.conversationId = :conversationId', { conversationId })
    .andWhere('read.id IS NULL')
    .andWhere('message.senderId != :userId', { userId }) // Exclude own messages
    .orderBy('message.createdAt', 'ASC')
    .getMany();
}
```

### Finding Conversations with Last Message

```typescript
async findUserConversationsWithLastMessage(userId: string) {
  return await this.conversationRepository
    .createQueryBuilder('conversation')
    .innerJoin('conversation.participants', 'participant', 'participant.userId = :userId', { userId })
    .leftJoinAndSelect('conversation.messages', 'lastMessage')
    .leftJoinAndSelect('lastMessage.sender', 'sender')
    .where((qb) => {
      const subQuery = qb.subQuery()
        .select('MAX(m.createdAt)')
        .from('message', 'm')
        .where('m.conversationId = conversation.id')
        .getQuery();
      return 'lastMessage.createdAt = (' + subQuery + ')';
    })
    .orderBy('lastMessage.createdAt', 'DESC')
    .getMany();
}
```

## Repository Injection in Services

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    
    @InjectRepository(MessageRead)
    private messageReadRepository: Repository<MessageRead>,
    
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}
  
  // Your service methods here...
}
```

These examples show how to leverage the TypeORM relationships to build efficient queries and maintain data consistency in your chat application.
