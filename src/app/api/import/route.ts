import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.text !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: `CSV parse error: ${parsed.errors[0].message}` }, { status: 400 });
    }

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Required column check
    const requiredColumns = ['month', 'type', 'category', 'name', 'budgeted_amount', 'actual_amount'];
    const headers = Object.keys(rows[0]);
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        return NextResponse.json({ error: `Missing required column "${col}" in CSV` }, { status: 400 });
      }
    }

    const db = getDb();
    let importedCount = 0;

    const importTransaction = db.transaction(() => {
      const insertMonth = db.prepare(`
        INSERT OR IGNORE INTO months (id, year, month, created_at)
        VALUES (?, ?, ?, ?)
      `);

      const insertItem = db.prepare(`
        INSERT INTO budget_items (month_id, type, category, name, budgeted_amount, actual_amount, notes, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of rows) {
        const monthId = String(row.month || '').trim();
        const match = monthId.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
        if (!match) continue; // Skip invalid month format rows

        const year = parseInt(match[1], 10);
        const monthNum = parseInt(match[2], 10);
        insertMonth.run(monthId, year, monthNum, new Date().toISOString());

        const type = row.type?.toString().toLowerCase().trim() === 'income' ? 'income' : 'expense';
        const category = String(row.category || 'General').trim() || 'General';
        const name = String(row.name || '').trim();
        if (!name) continue;

        const budgeted = Math.max(0, parseFloat(row.budgeted_amount) || 0);
        const actual = Math.max(0, parseFloat(row.actual_amount) || 0);
        const notes = row.notes ? String(row.notes).trim() : null;

        insertItem.run(monthId, type, category, name, budgeted, actual, notes, 0);
        importedCount++;
      }
    });

    importTransaction();

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}
