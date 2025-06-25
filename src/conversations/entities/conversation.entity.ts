import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { Participant } from '../../users/entities/participants.entity';

export enum ConversationType {
  GROUP = 'group',
  DIRECT = 'direct',
}
@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ nullable: true, default: null })
  photo: string;

  @Column()
  description: string;

  @Column()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.createdConversations)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @OneToMany(() => Participant, (participant) => participant.conversation)
  participants: Participant[];
}
