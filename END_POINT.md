# Auth Endpoints
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET  /auth/me
- PUT  /auth/profile

# User Management
- GET    /users/search?q={query}
- GET    /users/{userId}
- PUT    /users/{userId}
- POST   /users/{userId}/block
- DELETE /users/{userId}/block

# Conversations
- GET    /conversations
- POST   /conversations
- GET    /conversations/{conversationId}
- PUT    /conversations/{conversationId}
- DELETE /conversations/{conversationId}
- POST   /conversations/{conversationId}/participants
- DELETE /conversations/{conversationId}/participants/{userId}

# Messages
- GET    /conversations/{conversationId}/messages
- POST   /conversations/{conversationId}/messages
- PUT    /messages/{messageId}
- DELETE /messages/{messageId}
- POST   /messages/{messageId}/read


# Client to Server Events
// Connection events
- 'authenticate' -> { token: string }
- 'join_conversation' -> { conversationId: string }
- 'leave_conversation' -> { conversationId: string }

// Message events
- 'send_message' -> { conversationId, content, type, replyTo? }
- 'typing_start' -> { conversationId }
- 'typing_stop' -> { conversationId }
- 'message_read' -> { messageId }

// Call events
- 'call_initiate' -> { conversationId, type: 'audio' | 'video' }
- 'call_answer' -> { callId }
- 'call_reject' -> { callId }
- 'call_end' -> { callId }


# Server to Client Events
// Message events
- 'message_received' -> { message, conversation }
- 'message_updated' -> { messageId, content, editedAt }
- 'message_deleted' -> { messageId }
- 'message_read' -> { messageId, userId, readAt }

// User status events
- 'user_online' -> { userId }
- 'user_offline' -> { userId, lastSeen }
- 'user_typing' -> { userId, conversationId }

// Call events
- 'call_incoming' -> { callId, from, type }
- 'call_answered' -> { callId }
- 'call_rejected' -> { callId }
- 'call_ended' -> { callId }