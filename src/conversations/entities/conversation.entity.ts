import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
}
