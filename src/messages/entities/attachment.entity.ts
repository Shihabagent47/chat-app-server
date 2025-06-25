import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  url: string;

  @Column()
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
