import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionHardening1715886000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inquisition' AND enumtypid = 'transaction_type'::regtype) THEN
          ALTER TYPE transaction_type RENAME VALUE 'inquisition' TO 'acquisition';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE designs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE material_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE production_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE production_milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE cutting_lists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE bill_of_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE qc_checks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE procurement_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE procurement_request_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE client_designer_assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE registration_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE registration_codes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email) WHERE email IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
      CREATE INDEX IF NOT EXISTS idx_orders_designer_id ON orders(handled_by_designer_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_price_offers_order_id ON price_offers(order_id);
      CREATE INDEX IF NOT EXISTS idx_price_offers_created_by ON price_offers(created_by);
      CREATE INDEX IF NOT EXISTS idx_designs_order_id ON designs(order_id);
      CREATE INDEX IF NOT EXISTS idx_designs_designer_id ON designs(designer_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
      CREATE INDEX IF NOT EXISTS idx_material_transactions_item_id ON material_transactions(item_id);
      CREATE INDEX IF NOT EXISTS idx_material_transactions_design_id ON material_transactions(design_id);
      CREATE INDEX IF NOT EXISTS idx_material_transactions_actor_id ON material_transactions(actor_id);
      CREATE INDEX IF NOT EXISTS idx_production_milestones_order_id ON production_milestones(order_id);
      CREATE INDEX IF NOT EXISTS idx_production_milestones_actor_id ON production_milestones(actor_id);
      CREATE INDEX IF NOT EXISTS idx_production_schedules_order_id ON production_schedules(order_id);
      CREATE INDEX IF NOT EXISTS idx_production_schedules_coordinator_id ON production_schedules(coordinator_id);
      CREATE INDEX IF NOT EXISTS idx_cutting_lists_order_id ON cutting_lists(order_id);
      CREATE INDEX IF NOT EXISTS idx_cutting_lists_created_by ON cutting_lists(created_by);
      CREATE INDEX IF NOT EXISTS idx_cutting_lists_decided_by ON cutting_lists(decided_by);
      CREATE INDEX IF NOT EXISTS idx_bom_order_id ON bill_of_materials(order_id);
      CREATE INDEX IF NOT EXISTS idx_qc_checks_order_id ON qc_checks(order_id);
      CREATE INDEX IF NOT EXISTS idx_qc_checks_inspector_id ON qc_checks(inspector_id);
      CREATE INDEX IF NOT EXISTS idx_procurement_request_items_request_id ON procurement_request_items(procurement_request_id);
      CREATE INDEX IF NOT EXISTS idx_procurement_request_items_item_id ON procurement_request_items(item_id);
      CREATE INDEX IF NOT EXISTS idx_client_designer_assignments_client_id ON client_designer_assignments(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_designer_assignments_designer_id ON client_designer_assignments(designer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_client_designer_assignments_designer_id;
      DROP INDEX IF EXISTS idx_client_designer_assignments_client_id;
      DROP INDEX IF EXISTS idx_procurement_request_items_item_id;
      DROP INDEX IF EXISTS idx_procurement_request_items_request_id;
      DROP INDEX IF EXISTS idx_qc_checks_inspector_id;
      DROP INDEX IF EXISTS idx_qc_checks_order_id;
      DROP INDEX IF EXISTS idx_bom_order_id;
      DROP INDEX IF EXISTS idx_cutting_lists_decided_by;
      DROP INDEX IF EXISTS idx_cutting_lists_created_by;
      DROP INDEX IF EXISTS idx_cutting_lists_order_id;
      DROP INDEX IF EXISTS idx_production_schedules_coordinator_id;
      DROP INDEX IF EXISTS idx_production_schedules_order_id;
      DROP INDEX IF EXISTS idx_production_milestones_actor_id;
      DROP INDEX IF EXISTS idx_production_milestones_order_id;
      DROP INDEX IF EXISTS idx_material_transactions_actor_id;
      DROP INDEX IF EXISTS idx_material_transactions_design_id;
      DROP INDEX IF EXISTS idx_material_transactions_item_id;
      DROP INDEX IF EXISTS idx_notifications_order_id;
      DROP INDEX IF EXISTS idx_notifications_user_id;
      DROP INDEX IF EXISTS idx_messages_sender_id;
      DROP INDEX IF EXISTS idx_designs_designer_id;
      DROP INDEX IF EXISTS idx_designs_order_id;
      DROP INDEX IF EXISTS idx_price_offers_created_by;
      DROP INDEX IF EXISTS idx_price_offers_order_id;
      DROP INDEX IF EXISTS idx_order_items_order_id;
      DROP INDEX IF EXISTS idx_orders_designer_id;
      DROP INDEX IF EXISTS idx_orders_client_id;
      DROP INDEX IF EXISTS idx_users_email_unique;
    `);
  }
}
