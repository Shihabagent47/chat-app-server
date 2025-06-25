# Database Schema & Entity Relationships

This document describes the database schema and entity relationships for the Chat Application Backend.

## Entity Overview

The application uses 6 main entities to handle user management, conversations, messages, and related functionality:

1. **User** - Application users
2. **Conversation** - Chat conversations (group or direct)
3. **Message** - Individual messages within conversations
4. **Attachment** - File attachments for messages
5. **MessageRead** - Tracks which users have read which messages
6. **Participant** - Junction table for users participating in conversations

## Entity Relationships

### User Entity
- **Primary Key**: `id` (UUID)
- **One-to-Many Relationships**:
  - `sentMessages` → Messages sent by this user
  - `messageReads` → Messages read by this user
  - `participations` → Conversations this user participates in
  - `createdConversations` → Conversations created by this user

### Conversation Entity
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `createdBy` → User who created the conversation
- **One-to-Many Relationships**:
  - `messages` → Messages in this conversation
  - `participants` → Users participating in this conversation
- **Many-to-One Relationships**:
  - `creator` → User who created this conversation

### Message Entity
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `senderId` → User who sent the message
  - `conversationId` → Conversation containing the message
  - `replyToMessageId` → Message this is replying to (optional)
- **One-to-Many Relationships**:
  - `replies` → Messages replying to this message
  - `attachments` → File attachments for this message
  - `messageReads` → Read receipts for this message
- **Many-to-One Relationships**:
  - `sender` → User who sent this message
  - `conversation` → Conversation containing this message
  - `replyToMessage` → Message this is replying to (optional)

### Attachment Entity
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `messageId` → Message this attachment belongs to
- **Many-to-One Relationships**:
  - `message` → Message this attachment belongs to

### MessageRead Entity
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `messageId` → Message that was read
  - `userId` → User who read the message
- **Many-to-One Relationships**:
  - `message` → Message that was read
  - `user` → User who read the message

### Participant Entity
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `conversationId` → Conversation the user participates in
  - `userId` → User participating in the conversation
- **Many-to-One Relationships**:
  - `conversation` → Conversation the user participates in
  - `user` → User participating in the conversation

## Key Features

### Message Threading
- Messages can reply to other messages via `replyToMessageId`
- Self-referential relationship allows for threaded conversations

### Read Receipts
- `MessageRead` entity tracks when users read messages
- Enables "seen by" functionality and read receipt indicators

### Conversation Types
- Supports both `GROUP` and `DIRECT` conversation types
- Group conversations can have multiple participants with different roles

### File Attachments
- Messages can have multiple file attachments
- Supports thumbnails for image/video attachments
- Tracks file metadata (size, type, name)

### User Roles
- Participants can have `ADMIN` or `MEMBER` roles in conversations
- Enables permission-based features and moderation

## TypeORM Configuration

All entities are configured with:
- UUID primary keys for better scalability
- Proper foreign key relationships with `@JoinColumn`
- Cascade options for related data management
- Timestamps for audit trails (`createdAt`, `updatedAt`)

The relationships are set up to enable efficient querying and maintain data integrity across the chat application.
