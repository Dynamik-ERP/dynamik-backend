import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  invoice_number: string;

  @Index()
  @Column({ type: 'uuid' })
  order_id: string;

  @Index()
  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: string;

  @Column({ type: 'varchar', length: 3, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  issued_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
