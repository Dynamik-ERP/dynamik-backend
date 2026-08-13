import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  getOrdersSummary() {
    return this.dataSource.query(`
      SELECT status, COUNT(*)::int AS count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
  }

  getInventoryTurnover() {
    return this.dataSource.query(`
      SELECT i.id, i.name, i.quantity,
             COALESCE(SUM(CASE WHEN mt.type = 'withdrawal' THEN mt.quantity ELSE 0 END), 0)::numeric(12,2) AS withdrawn,
             COALESCE(SUM(CASE WHEN mt.type = 'acquisition' THEN mt.quantity ELSE 0 END), 0)::numeric(12,2) AS acquired
      FROM inventory_items i
      LEFT JOIN material_transactions mt ON mt.item_id = i.id
      GROUP BY i.id, i.name, i.quantity
      ORDER BY i.name ASC
    `);
  }

  getQcPassRate() {
    return this.dataSource.query(`
      SELECT station,
             COUNT(*)::int AS checks,
             SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END)::int AS passed,
             ROUND((SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS pass_rate
      FROM qc_checks
      GROUP BY station
      ORDER BY station ASC
    `);
  }
}
