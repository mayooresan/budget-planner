import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { initDb, getDb } from '../src/lib/db';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_budget.db');

function cleanTestDb(dbPath: string) {
  for (const ext of ['', '-wal', '-shm']) {
    const file = dbPath + ext;
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch {}
    }
  }
}

test('Database initialization and template seeding', () => {
  cleanTestDb(TEST_DB_PATH);

  const db = initDb(TEST_DB_PATH);
  
  // Verify tables exist
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];
  const tableNames = tables.map(t => t.name);
  assert.ok(tableNames.includes('months'), 'months table should exist');
  assert.ok(tableNames.includes('template_items'), 'template_items table should exist');
  assert.ok(tableNames.includes('budget_items'), 'budget_items table should exist');

  // Verify index exists
  const indices = db.prepare(`SELECT name FROM sqlite_master WHERE type='index'`).all() as { name: string }[];
  const indexNames = indices.map(i => i.name);
  assert.ok(indexNames.includes('idx_budget_items_month'), 'idx_budget_items_month should exist');

  // Verify foreign keys are enabled
  const fkStatus = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
  assert.strictEqual(fkStatus.foreign_keys, 1, 'foreign keys should be enabled');

  // Verify default seed data in template_items
  const templateCount = db.prepare(`SELECT count(*) as count FROM template_items`).get() as { count: number };
  assert.ok(templateCount.count > 0, 'template_items should be seeded');

  // Verify re-running initDb does not duplicate seed data
  const db2 = initDb(TEST_DB_PATH);
  const templateCount2 = db2.prepare(`SELECT count(*) as count FROM template_items`).get() as { count: number };
  assert.strictEqual(templateCount2.count, templateCount.count, 'template_items count should not change on re-init');

  // Verify foreign key cascade delete
  db.prepare(`INSERT INTO months (id, year, month, created_at) VALUES ('2026-09', 2026, 9, '2026-09-01T00:00:00.000Z')`).run();
  db.prepare(`
    INSERT INTO budget_items (month_id, type, category, name, budgeted_amount, actual_amount, notes, sort_order)
    VALUES ('2026-09', 'expense', 'Housing', 'Rent', 1500, 1500, null, 1)
  `).run();

  const itemBefore = db.prepare(`SELECT count(*) as count FROM budget_items WHERE month_id = '2026-09'`).get() as { count: number };
  assert.strictEqual(itemBefore.count, 1, 'budget item should exist before month deletion');

  db.prepare(`DELETE FROM months WHERE id = '2026-09'`).run();
  const itemAfter = db.prepare(`SELECT count(*) as count FROM budget_items WHERE month_id = '2026-09'`).get() as { count: number };
  assert.strictEqual(itemAfter.count, 0, 'budget item should be cascade deleted when month is deleted');

  db.close();
  cleanTestDb(TEST_DB_PATH);
});

test('getDb returns database singleton instance', () => {
  const db1 = getDb();
  const db2 = getDb();
  assert.ok(db1, 'getDb should return an instance');
  assert.strictEqual(db1, db2, 'getDb should return singleton instance');
});
