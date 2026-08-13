import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PriceOfferStatus } from './enums';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('price_offers')
export class PriceOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, (order) => order.priceOffers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 3, default: 'ETB' })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: string;

  @Column({ type: 'enum', enum: PriceOfferStatus, default: PriceOfferStatus.PENDING })
  status: PriceOfferStatus;

  @Index()
  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
