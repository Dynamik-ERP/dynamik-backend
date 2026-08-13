import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DesignStatus } from './enums';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('designs')
export class Design {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, (order) => order.designs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ type: 'uuid' })
  designer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'designer_id' })
  designer: User;

  @Column({ type: 'text', nullable: true })
  file_url: string | null;

  @Column({ type: 'enum', enum: DesignStatus, default: DesignStatus.DRAFTING })
  status: DesignStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
