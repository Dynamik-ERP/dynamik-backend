import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenHash1715886000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS refresh_token_hash;
    `);
  }
}
