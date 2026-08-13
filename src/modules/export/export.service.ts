import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ExportService {
  constructor(private readonly dataSource: DataSource) {}

  async exportOrdersCsv() {
    const rows = await this.dataSource.query(`
      SELECT o.id, o.status, o.created_at, o.updated_at,
             c.full_name AS client_name,
             d.full_name AS designer_name
      FROM orders o
      LEFT JOIN users c ON c.id = o.client_id
      LEFT JOIN users d ON d.id = o.handled_by_designer_id
      ORDER BY o.created_at DESC
    `);
    return this.toCsv(rows, ['id', 'status', 'client_name', 'designer_name', 'created_at', 'updated_at']);
  }

  async exportInventoryCsv() {
    const rows = await this.dataSource.query(`
      SELECT id, name, category, quantity, status, updated_at
      FROM inventory_items
      ORDER BY name ASC
    `);
    return this.toCsv(rows, ['id', 'name', 'category', 'quantity', 'status', 'updated_at']);
  }

  private toCsv(rows: Record<string, unknown>[], columns: string[]) {
    const escape = (value: unknown) => {
      if (value === null || value === undefined) return '';
      const text = String(value).replace(/"/g, '""');
      return /[",\n]/.test(text) ? `"${text}"` : text;
    };
    return [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => escape(row[column])).join(',')),
    ].join('\n');
  }
}
