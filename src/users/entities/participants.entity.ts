import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export enum ParticipantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity()
@Index('IDX_PARTICIPANT_USER_CONVERSATION', ['userId', 'conversationId'], {
  unique: true,
})
@Index('IDX_PARTICIPANT_CONVERSATION_ROLE', ['conversationId', 'role'])
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_PARTICIPANT_CONVERSATION_ID')
  conversationId: string;

  @Column()
  @Index('IDX_PARTICIPANT_USER_ID')
  userId: string;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'enum', enum: ParticipantRole })
  role: ParticipantRole;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.participations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.participants)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
