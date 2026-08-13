import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApprovalStatus } from './enums';
import { User } from './user.entity';
import { ProcurementRequestItem } from './procurement-request-item.entity';

@Entity('procurement_requests')
export class ProcurementRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  requested_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requestedByUser: User;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @OneToMany(() => ProcurementRequestItem, (item) => item.procurementRequest)
  items: ProcurementRequestItem[];
}
