import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { InventoryCategory } from './enums';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: InventoryCategory })
  category: InventoryCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity: string;

  @Column({ type: 'varchar', length: 16, default: 'available' })
  status: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
