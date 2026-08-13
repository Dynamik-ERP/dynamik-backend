import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { QcResult } from './enums';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('qc_checks')
export class QcCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', length: 40 })
  station: string;

  @Column({ type: 'enum', enum: QcResult })
  result: QcResult;

  @Index()
  @Column({ type: 'uuid' })
  inspector_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  checked_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
