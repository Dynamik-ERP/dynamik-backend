import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1715886000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'client', 'design', 'operations', 'warehouse', 'cutting', 'cnc', 'edge_banding', 'qc');
      CREATE TYPE order_status AS ENUM ('draft', 'in_progress', 'ready_for_production', 'in_production', 'completed', 'cancelled');
      CREATE TYPE price_offer_status AS ENUM ('pending', 'approved', 'revision_requested');
      CREATE TYPE design_status AS ENUM ('drafting', 'submitted', 'approved', 'revision_requested');
      CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'declined');
      CREATE TYPE milestone_department AS ENUM ('cutting', 'cnc', 'edge_banding');
      CREATE TYPE milestone_event AS ENUM ('acknowledged', 'done');
      CREATE TYPE qc_result AS ENUM ('pass', 'fail');
      CREATE TYPE inventory_category AS ENUM ('perishable', 'non_perishable');
      CREATE TYPE transaction_type AS ENUM ('acquisition', 'withdrawal');
      CREATE TYPE message_channel AS ENUM ('telegram', 'web');
      CREATE TYPE message_type AS ENUM ('text', 'image', 'document');
    `);

    // 2. Create Tables
    await queryRunner.query(`
      CREATE TABLE registration_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(32) UNIQUE NOT NULL,
        role user_role NOT NULL,
        issued_by UUID,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        used_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(120) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(120),
        role user_role NOT NULL,
        reg_code_id UUID REFERENCES registration_codes(id),
        password_hash TEXT,
        refresh_token_hash TEXT,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        telegram_chat_id BIGINT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        CONSTRAINT chk_client_has_no_credentials CHECK (
          (role = 'client' AND password_hash IS NULL AND reg_code_id IS NULL) OR
          (role != 'client')
        )
      );

      -- Add foreign key constraints back to registration_codes for users linking
      ALTER TABLE registration_codes ADD CONSTRAINT fk_reg_codes_issued_by FOREIGN KEY (issued_by) REFERENCES users(id);
      ALTER TABLE registration_codes ADD CONSTRAINT fk_reg_codes_used_by FOREIGN KEY (used_by) REFERENCES users(id);

      CREATE TABLE client_designer_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        designer_id UUID NOT NULL REFERENCES users(id),
        assigned_by UUID NOT NULL REFERENCES users(id),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES users(id),
        status order_status NOT NULL DEFAULT 'draft',
        handled_by_designer_id UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        item_type VARCHAR(40) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0)
      );

      CREATE TABLE price_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        status price_offer_status NOT NULL DEFAULT 'pending',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE designs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        designer_id UUID NOT NULL REFERENCES users(id),
        file_url TEXT,
        status design_status NOT NULL DEFAULT 'drafting',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id),
        channel message_channel NOT NULL DEFAULT 'web',
        message_type message_type NOT NULL DEFAULT 'text',
        body TEXT,
        telegram_message_id BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE production_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        delivery_date DATE NOT NULL,
        production_start DATE NOT NULL,
        production_end DATE NOT NULL,
        coordinator_id UUID NOT NULL REFERENCES users(id)
      );

      CREATE TABLE cutting_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status approval_status NOT NULL DEFAULT 'pending',
        created_by UUID NOT NULL REFERENCES users(id),
        decided_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE bill_of_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        boards JSONB NOT NULL DEFAULT '{}',
        colors JSONB NOT NULL DEFAULT '{}',
        accessories JSONB NOT NULL DEFAULT '{}',
        edging JSONB NOT NULL DEFAULT '{}',
        status approval_status NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE production_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        department milestone_department NOT NULL,
        event_type milestone_event NOT NULL,
        actor_id UUID NOT NULL REFERENCES users(id),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE qc_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        station VARCHAR(40) NOT NULL,
        result qc_result NOT NULL,
        inspector_id UUID NOT NULL REFERENCES users(id),
        notes TEXT,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) NOT NULL,
        category inventory_category NOT NULL,
        quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(16) NOT NULL DEFAULT 'available'
      );

      CREATE TABLE material_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        type transaction_type NOT NULL,
        quantity DECIMAL(12,2) NOT NULL,
        design_id UUID REFERENCES designs(id),
        actor_id UUID NOT NULL REFERENCES users(id),
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_withdrawal_requires_design CHECK (
          (type = 'withdrawal' AND design_id IS NOT NULL) OR
          (type != 'withdrawal')
        )
      );

      CREATE TABLE procurement_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requested_by UUID NOT NULL REFERENCES users(id),
        status approval_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE procurement_request_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        quantity DECIMAL(12,2) NOT NULL CHECK (quantity > 0.00)
      );

      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        type VARCHAR(64) NOT NULL,
        message TEXT NOT NULL,
        read_status BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 3. Create Indexes & Triggers
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_users_client_phone ON users(phone) WHERE role = 'client';
      CREATE INDEX idx_messages_order_created ON messages(order_id, created_at);

      -- Trigger function to enforce sequence (Cutting -> CNC -> Edge Banding)
      CREATE OR REPLACE FUNCTION check_milestone_sequence()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.event_type = 'acknowledged' THEN
          -- CNC acknowledgement requires Cutting DONE
          IF NEW.department = 'cnc' THEN
            IF NOT EXISTS (
              SELECT 1 FROM production_milestones
              WHERE order_id = NEW.order_id
                AND department = 'cutting'
                AND event_type = 'done'
            ) THEN
              RAISE EXCEPTION 'Cannot acknowledge CNC: Cutting phase is not complete.';
            END IF;
          END IF;

          -- Edge Banding acknowledgement requires CNC DONE
          IF NEW.department = 'edge_banding' THEN
            IF NOT EXISTS (
              SELECT 1 FROM production_milestones
              WHERE order_id = NEW.order_id
                AND department = 'cnc'
                AND event_type = 'done'
            ) THEN
              RAISE EXCEPTION 'Cannot acknowledge Edge Banding: CNC phase is not complete.';
            END IF;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_production_milestones_sequence
      BEFORE INSERT ON production_milestones
      FOR EACH ROW
      EXECUTE FUNCTION check_milestone_sequence();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_production_milestones_sequence ON production_milestones;
      DROP FUNCTION IF EXISTS check_milestone_sequence;

      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS procurement_request_items CASCADE;
      DROP TABLE IF EXISTS procurement_requests CASCADE;
      DROP TABLE IF EXISTS material_transactions CASCADE;
      DROP TABLE IF EXISTS inventory_items CASCADE;
      DROP TABLE IF EXISTS qc_checks CASCADE;
      DROP TABLE IF EXISTS production_milestones CASCADE;
      DROP TABLE IF EXISTS bill_of_materials CASCADE;
      DROP TABLE IF EXISTS cutting_lists CASCADE;
      DROP TABLE IF EXISTS production_schedules CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS designs CASCADE;
      DROP TABLE IF EXISTS price_offers CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS client_designer_assignments CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS registration_codes CASCADE;

      DROP TYPE IF EXISTS message_type;
      DROP TYPE IF EXISTS message_channel;
      DROP TYPE IF EXISTS transaction_type;
      DROP TYPE IF EXISTS inventory_category;
      DROP TYPE IF EXISTS qc_result;
      DROP TYPE IF EXISTS milestone_event;
      DROP TYPE IF EXISTS milestone_department;
      DROP TYPE IF EXISTS approval_status;
      DROP TYPE IF EXISTS design_status;
      DROP TYPE IF EXISTS price_offer_status;
      DROP TYPE IF EXISTS order_status;
      DROP TYPE IF EXISTS user_role;
    `);
  }
}
