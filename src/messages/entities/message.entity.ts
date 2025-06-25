import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Attachment } from './attachment.entity';
import { MessageRead } from './message_reads.entity';

@Entity()
@Index('IDX_MESSAGE_CONVERSATION_CREATED_AT', ['conversationId', 'createdAt'])
@Index('IDX_MESSAGE_SENDER_CREATED_AT', ['senderId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_MESSAGE_SENDER_ID')
  senderId: string;

  @Column()
  content: string;

  @Column()
  @Index('IDX_MESSAGE_CONVERSATION_ID')
  conversationId: string;

  @Column({ nullable: true, default: null })
  @Index('IDX_MESSAGE_REPLY_TO_MESSAGE_ID')
  replyToMessageId: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index('IDX_MESSAGE_CREATED_AT')
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => Message, (message) => message.replies, { nullable: true })
  @JoinColumn({ name: 'replyToMessageId' })
  replyToMessage: Message;

  @OneToMany(() => Message, (message) => message.replyToMessage)
  replies: Message[];

  @OneToMany(() => Attachment, (attachment) => attachment.message)
  attachments: Attachment[];

  @OneToMany(() => MessageRead, (messageRead) => messageRead.message)
  messageReads: MessageRead[];
}
