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
import { OrderStatus } from './enums';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { PriceOffer } from './price-offer.entity';
import { Design } from './design.entity';
import { Message } from './message.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  client_id: string;

  @ManyToOne(() => User, (user) => user.clientOrders)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  status: OrderStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  handled_by_designer_id: string | null;

  @ManyToOne(() => User, (user) => user.designedOrders, { nullable: true })
  @JoinColumn({ name: 'handled_by_designer_id' })
  handledByDesigner: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => PriceOffer, (offer) => offer.order)
  priceOffers: PriceOffer[];

  @OneToMany(() => Design, (design) => design.order)
  designs: Design[];

  @OneToMany(() => Message, (message) => message.order)
  messages: Message[];
}
