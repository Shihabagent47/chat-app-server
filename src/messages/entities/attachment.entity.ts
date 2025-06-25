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

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_ATTACHMENT_MESSAGE_ID')
  messageId: string;

  @Column()
  url: string;

  @Column()
  @Index('IDX_ATTACHMENT_TYPE')
  type: string;

  @Column()
  size: number;

  @Column()
  name: string;

  @Column({ nullable: true, default: null })
  thumbnailUrl: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Message, (message) => message.attachments)
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
