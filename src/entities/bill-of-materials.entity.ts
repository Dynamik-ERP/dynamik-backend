import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApprovalStatus } from './enums';
import { Order } from './order.entity';

@Entity('bill_of_materials')
export class BillOfMaterials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'jsonb', default: {} })
  boards: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  colors: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  accessories: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  edging: Record<string, any>;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
