import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { MessageRead } from '../../messages/entities/message_reads.entity';
import { Participant } from './participants.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Index('IDX_USER_PHONE')
  phone: string;

  @Column()
  @Index('IDX_USER_EMAIL', { unique: true })
  email: string;

  @Column({ nullable: true, default: null })
  profile_photo: string;

  @Column({ nullable: true, default: null })
  access_token: string;

  @Column({ nullable: true, default: null })
  refresh_token: string;

  @Column({ nullable: true, default: null })
  device_token: string;

  @Column({ default: false })
  @Index('IDX_USER_IS_ONLINE')
  isOnline: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @Index('IDX_USER_LAST_SEEN')
  lastSeen: Date;

  @Column({ nullable: true, default: null })
  about: string;

  @Column()
  password: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => MessageRead, (messageRead) => messageRead.user)
  messageReads: MessageRead[];

  @OneToMany(() => Participant, (participant) => participant.user)
  participations: Participant[];

  @OneToMany(() => Conversation, (conversation) => conversation.creator)
  createdConversations: Conversation[];
}
