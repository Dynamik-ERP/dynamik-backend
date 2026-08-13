import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('client_designer_assignments')
@Unique(['client_id'])
export class ClientDesignerAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  client_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Index()
  @Column({ type: 'uuid' })
  designer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'designer_id' })
  designer: User;

  @Column({ type: 'uuid' })
  assigned_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User;

  @CreateDateColumn({ type: 'timestamptz' })
  assigned_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
