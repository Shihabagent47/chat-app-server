import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index('IDX_MESSAGE_READ_MESSAGE_USER', ['messageId', 'userId'], {
  unique: true,
})
@Index('IDX_MESSAGE_READ_USER_READ_AT', ['userId', 'readAt'])
export class MessageRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_MESSAGE_READ_MESSAGE_ID')
  messageId: string;

  @Column()
  @Index('IDX_MESSAGE_READ_USER_ID')
  userId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  readAt: Date;

  // Relationships
  @ManyToOne(() => Message, (message) => message.messageReads)
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @ManyToOne(() => User, (user) => user.messageReads)
  @JoinColumn({ name: 'userId' })
  user: User;
}
