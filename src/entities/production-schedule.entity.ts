import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('production_schedules')
export class ProductionSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'date' })
  delivery_date: string;

  @Column({ type: 'date' })
  production_start: string;

  @Column({ type: 'date' })
  production_end: string;

  @Index()
  @Column({ type: 'uuid' })
  coordinator_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'coordinator_id' })
  coordinator: User;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
