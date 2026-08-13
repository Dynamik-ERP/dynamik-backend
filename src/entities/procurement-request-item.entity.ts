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
import { ProcurementRequest } from './procurement-request.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('procurement_request_items')
@Check('"quantity" > 0')
export class ProcurementRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  procurement_request_id: string;

  @ManyToOne(() => ProcurementRequest, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'procurement_request_id' })
  procurementRequest: ProcurementRequest;

  @Index()
  @Column({ type: 'uuid' })
  item_id: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
