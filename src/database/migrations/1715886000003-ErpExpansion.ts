import { MigrationInterface, QueryRunner } from 'typeorm';

export class ErpExpansion1715886000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE price_offers
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
        ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(80) NOT NULL,
        actor_id UUID,
        changes JSONB,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);

      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(200),
        phone VARCHAR(20),
        email VARCHAR(200),
        address TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(20) UNIQUE NOT NULL,
        order_id UUID NOT NULL REFERENCES orders(id),
        client_id UUID NOT NULL REFERENCES users(id),
        subtotal DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        issued_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS invoices;
      DROP TABLE IF EXISTS vendors;
      DROP TABLE IF EXISTS audit_logs;
      ALTER TABLE price_offers DROP COLUMN IF EXISTS tax_amount;
      ALTER TABLE price_offers DROP COLUMN IF EXISTS tax_rate;
      ALTER TABLE price_offers DROP COLUMN IF EXISTS currency;
    `);
  }
}
