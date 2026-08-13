import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TransactionType } from './enums';
import { InventoryItem } from './inventory-item.entity';
import { Design } from './design.entity';
import { User } from './user.entity';

@Entity('material_transactions')
export class MaterialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  item_id: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  design_id: string | null;

  @ManyToOne(() => Design, { nullable: true })
  @JoinColumn({ name: 'design_id' })
  design: Design;

  @Index()
  @Column({ type: 'uuid' })
  actor_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  occurred_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
