import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
@Check('"quantity" > 0')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', length: 40 })
  item_type: string;

  @Column({ type: 'integer' })
  quantity: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
