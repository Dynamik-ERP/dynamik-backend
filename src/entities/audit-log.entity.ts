import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entity_type: string;

  @Index()
  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actor_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
