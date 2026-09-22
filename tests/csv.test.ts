import test from 'node:test';
import assert from 'node:assert';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { initDb, getDb } from '../src/lib/db';
import { getOrCreateMonthWithDb } from '../src/lib/budget-service';
import { GET } from '../src/app/api/export/route';
import { POST } from '../src/app/api/import/route';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_csv.db');

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

test('CSV data export structure and import parsing (unit logic)', () => {
  cleanTestDb(TEST_DB_PATH);
  const db = initDb(TEST_DB_PATH);

  getOrCreateMonthWithDb(db, '2026-09');

  // Export check
  const items = db.prepare(`
    SELECT month_id as month, type, category, name, budgeted_amount, actual_amount, COALESCE(notes, '') as notes
    FROM budget_items
    ORDER BY month_id ASC, type DESC, sort_order ASC
  `).all();

  const csvString = Papa.unparse(items);
  assert.ok(csvString.includes('month,type,category,name,budgeted_amount,actual_amount,notes'));
  assert.ok(csvString.includes('2026-09,income,Salary,Salary,5000,0'));

  // Import check
  const csvToImport = `month,type,category,name,budgeted_amount,actual_amount,notes
2026-10,income,Consulting,Bonus Project,2000,2000,Quarterly bonus
2026-10,expense,Travel,Train Ticket,120,120,Work trip`;

  const parsed = Papa.parse(csvToImport, { header: true, skipEmptyLines: true });
  assert.strictEqual(parsed.data.length, 2);

  db.close();
  cleanTestDb(TEST_DB_PATH);
});

test('GET /api/export route handler exports CSV correctly', async () => {
  // Ensure default db has at least month 2026-09 seeded
  const db = getDb();
  getOrCreateMonthWithDb(db, '2026-09');

  // 1. Test export all months
  const reqAll = new NextRequest('http://localhost:3000/api/export');
  const resAll = await GET(reqAll);
  assert.strictEqual(resAll.status, 200);
  assert.strictEqual(resAll.headers.get('Content-Type'), 'text/csv; charset=utf-8');
  assert.strictEqual(resAll.headers.get('Content-Disposition'), 'attachment; filename="budget-export-all.csv"');
  const csvAll = await resAll.text();
  assert.ok(csvAll.includes('month,type,category,name,budgeted_amount,actual_amount,notes'));
  assert.ok(csvAll.includes('2026-09,income,Salary,Salary,5000,0'));

  // 2. Test export specific month
  const reqMonth = new NextRequest('http://localhost:3000/api/export?month=2026-09');
  const resMonth = await GET(reqMonth);
  assert.strictEqual(resMonth.status, 200);
  assert.strictEqual(resMonth.headers.get('Content-Disposition'), 'attachment; filename="budget-export-2026-09.csv"');
  const csvMonth = await resMonth.text();
  assert.ok(csvMonth.includes('2026-09,income,Salary,Salary,5000,0'));
});

test('POST /api/import route handler validates input and imports data', async () => {
  const db = getDb();
  // Ensure clean state for 2026-12
  db.prepare('DELETE FROM budget_items WHERE month_id = ?').run('2026-12');
  db.prepare('DELETE FROM months WHERE id = ?').run('2026-12');

  // 1. Error case: No file uploaded
  const emptyForm = new FormData();
  const reqNoFile = new NextRequest('http://localhost:3000/api/import', {
    method: 'POST',
    body: emptyForm,
  });
  const resNoFile = await POST(reqNoFile);
  assert.strictEqual(resNoFile.status, 400);
  const jsonNoFile = await resNoFile.json();
  assert.strictEqual(jsonNoFile.error, 'No file uploaded');

  // 2. Error case: Empty CSV file
  const emptyCsvForm = new FormData();
  emptyCsvForm.append('file', new Blob(['']), 'empty.csv');
  const reqEmpty = new NextRequest('http://localhost:3000/api/import', {
    method: 'POST',
    body: emptyCsvForm,
  });
  const resEmpty = await POST(reqEmpty);
  assert.strictEqual(resEmpty.status, 400);
  const jsonEmpty = await resEmpty.json();
  assert.strictEqual(jsonEmpty.error, 'CSV file is empty');

  // 3. Error case: Missing required column
  const missingColForm = new FormData();
  missingColForm.append(
    'file',
    new Blob(['month,type,category,name,budgeted_amount\n2026-10,income,Salary,Salary,5000']),
    'invalid.csv'
  );
  const reqMissingCol = new NextRequest('http://localhost:3000/api/import', {
    method: 'POST',
    body: missingColForm,
  });
  const resMissingCol = await POST(reqMissingCol);
  assert.strictEqual(resMissingCol.status, 400);
  const jsonMissingCol = await resMissingCol.json();
  assert.ok(jsonMissingCol.error.includes('Missing required column "actual_amount"'));

  // 4. Success case: Valid CSV with multiple items, invalid month skipping, and empty name skipping
  const validCsv = `month,type,category,name,budgeted_amount,actual_amount,notes
2026-12,income,Bonus,Year-End Bonus,3000,3200,Holiday bonus
2026-12,expense,Gifts,Family Gifts,500,450,Holiday shopping
invalid-month,expense,Other,Skip Me,100,100,Bad month
2026-12,expense,Other,   ,100,100,Blank name`;

  const validForm = new FormData();
  validForm.append('file', new Blob([validCsv]), 'import.csv');
  const reqValid = new NextRequest('http://localhost:3000/api/import', {
    method: 'POST',
    body: validForm,
  });
  const resValid = await POST(reqValid);
  assert.strictEqual(resValid.status, 200);
  const jsonValid = await resValid.json();
  assert.strictEqual(jsonValid.success, true);
  assert.strictEqual(jsonValid.importedCount, 2);

  // Verify in database
  const month12 = db.prepare('SELECT * FROM months WHERE id = ?').get('2026-12') as any;
  assert.ok(month12, 'Month 2026-12 should have been created');
  assert.strictEqual(month12.year, 2026);
  assert.strictEqual(month12.month, 12);

  const items = db.prepare('SELECT * FROM budget_items WHERE month_id = ?').all('2026-12') as any[];
  assert.strictEqual(items.length, 2);
  const bonusItem = items.find(i => i.name === 'Year-End Bonus');
  assert.ok(bonusItem);
  assert.strictEqual(bonusItem.budgeted_amount, 3000);
  assert.strictEqual(bonusItem.actual_amount, 3200);
  assert.strictEqual(bonusItem.notes, 'Holiday bonus');

  // Clean up
  db.prepare('DELETE FROM budget_items WHERE month_id = ?').run('2026-12');
  db.prepare('DELETE FROM months WHERE id = ?').run('2026-12');
});
