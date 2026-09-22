import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'all';

    const db = getDb();
    let query = `
      SELECT month_id as month, type, category, name, budgeted_amount as amount, COALESCE(notes, '') as notes
      FROM budget_items
    `;
    const params: string[] = [];

    if (month !== 'all') {
      query += ' WHERE month_id = ?';
      params.push(month);
    }
    query += ' ORDER BY month_id DESC, type DESC, sort_order ASC, id ASC';

    const items = db.prepare(query).all(...params);
    const csv = items.length > 0
      ? Papa.unparse(items, { header: true })
      : 'month,type,category,name,amount,notes\n';

    const filename = month === 'all' ? `budget-export-all.csv` : `budget-export-${month}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
