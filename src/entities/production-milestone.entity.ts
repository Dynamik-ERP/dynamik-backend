import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MilestoneDepartment, MilestoneEvent } from './enums';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('production_milestones')
export class ProductionMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: MilestoneDepartment })
  department: MilestoneDepartment;

  @Column({ type: 'enum', enum: MilestoneEvent })
  event_type: MilestoneEvent;

  @Index()
  @Column({ type: 'uuid' })
  actor_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  timestamp: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
