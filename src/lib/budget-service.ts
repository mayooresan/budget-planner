import Database from 'better-sqlite3';
import { Month, BudgetItem, TemplateItem, MonthAnalytics, CategorySummary, ItemType } from './types';

export function getOrCreateMonthWithDb(db: Database.Database, monthId: string): { month: Month; items: BudgetItem[] } {
  const match = monthId.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) {
    throw new Error(`Invalid month format "${monthId}". Expected YYYY-MM.`);
  }
  const year = parseInt(match[1], 10);
  const monthNum = parseInt(match[2], 10);

  const existingMonth = db.prepare('SELECT * FROM months WHERE id = ?').get(monthId) as Month | undefined;
  if (!existingMonth) {
    const createMonthTransaction = db.transaction(() => {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO months (id, year, month, created_at) VALUES (?, ?, ?, ?)').run(monthId, year, monthNum, now);

      const templates = db.prepare('SELECT * FROM template_items ORDER BY sort_order ASC, id ASC').all() as TemplateItem[];
      const insertItem = db.prepare(`
        INSERT INTO budget_items (month_id, type, category, name, budgeted_amount, actual_amount, sort_order)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `);

      for (const t of templates) {
        insertItem.run(monthId, t.type, t.category, t.name, t.default_budgeted_amount, t.sort_order);
      }
    });

    createMonthTransaction();
  }

  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(monthId) as Month;
  const items = db.prepare('SELECT * FROM budget_items WHERE month_id = ? ORDER BY type DESC, sort_order ASC, id ASC').all(monthId) as BudgetItem[];
  return { month, items };
}

export function listMonthsWithDb(db: Database.Database): Month[] {
  return db.prepare('SELECT * FROM months ORDER BY id DESC').all() as Month[];
}

export function addBudgetItemWithDb(
  db: Database.Database,
  data: { month_id: string; type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount?: number; notes?: string }
): BudgetItem {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Item name is required');
  }
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as maxOrder FROM budget_items WHERE month_id = ? AND type = ?').get(data.month_id, data.type) as any).maxOrder;

  const result = db.prepare(`
    INSERT INTO budget_items (month_id, type, category, name, budgeted_amount, actual_amount, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.month_id,
    data.type,
    data.category?.trim() || 'General',
    data.name.trim(),
    Math.max(0, Number(data.budgeted_amount) || 0),
    Math.max(0, Number(data.actual_amount) || 0),
    data.notes?.trim() || null,
    maxOrder + 1
  );

  return db.prepare('SELECT * FROM budget_items WHERE id = ?').get(result.lastInsertRowid) as BudgetItem;
}

export function updateBudgetItemWithDb(
  db: Database.Database,
  id: number,
  data: Partial<Omit<BudgetItem, 'id' | 'month_id'>>
): BudgetItem {
  const existing = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem | undefined;
  if (!existing) throw new Error(`Budget item #${id} not found`);

  if (data.name !== undefined && data.name.trim() === '') {
    throw new Error('Item name cannot be empty');
  }

  const type = data.type ?? existing.type;
  const category = data.category !== undefined ? data.category.trim() : existing.category;
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const budgeted_amount = data.budgeted_amount !== undefined ? Math.max(0, Number(data.budgeted_amount) || 0) : existing.budgeted_amount;
  const actual_amount = data.actual_amount !== undefined ? Math.max(0, Number(data.actual_amount) || 0) : existing.actual_amount;
  const notes = data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes;
  const sort_order = data.sort_order !== undefined ? Number(data.sort_order) : existing.sort_order;

  db.prepare(`
    UPDATE budget_items
    SET type = ?, category = ?, name = ?, budgeted_amount = ?, actual_amount = ?, notes = ?, sort_order = ?
    WHERE id = ?
  `).run(type, category, name, budgeted_amount, actual_amount, notes, sort_order, id);

  return db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem;
}

export function deleteBudgetItemWithDb(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM budget_items WHERE id = ?').run(id);
}

export function getTemplateItemsWithDb(db: Database.Database): TemplateItem[] {
  return db.prepare('SELECT * FROM template_items ORDER BY type DESC, sort_order ASC, id ASC').all() as TemplateItem[];
}

export function addTemplateItemWithDb(db: Database.Database, data: Omit<TemplateItem, 'id'>): TemplateItem {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Template item name is required');
  }

  const result = db.prepare(`
    INSERT INTO template_items (type, category, name, default_budgeted_amount, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.type, data.category?.trim() || 'General', data.name.trim(), Math.max(0, Number(data.default_budgeted_amount) || 0), data.sort_order || 0);

  return db.prepare('SELECT * FROM template_items WHERE id = ?').get(result.lastInsertRowid) as TemplateItem;
}

export function updateTemplateItemWithDb(db: Database.Database, id: number, data: Partial<Omit<TemplateItem, 'id'>>): TemplateItem {
  const existing = db.prepare('SELECT * FROM template_items WHERE id = ?').get(id) as TemplateItem | undefined;
  if (!existing) throw new Error(`Template item #${id} not found`);

  if (data.name !== undefined && data.name.trim() === '') {
    throw new Error('Template item name cannot be empty');
  }

  const type = data.type ?? existing.type;
  const category = data.category !== undefined ? data.category.trim() : existing.category;
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const default_budgeted_amount = data.default_budgeted_amount !== undefined ? Math.max(0, Number(data.default_budgeted_amount) || 0) : existing.default_budgeted_amount;
  const sort_order = data.sort_order !== undefined ? Number(data.sort_order) : existing.sort_order;

  db.prepare(`
    UPDATE template_items
    SET type = ?, category = ?, name = ?, default_budgeted_amount = ?, sort_order = ?
    WHERE id = ?
  `).run(type, category, name, default_budgeted_amount, sort_order, id);

  return db.prepare('SELECT * FROM template_items WHERE id = ?').get(id) as TemplateItem;
}

export function deleteTemplateItemWithDb(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM template_items WHERE id = ?').run(id);
}

export function getMonthAnalyticsWithDb(db: Database.Database, monthId: string): MonthAnalytics {
  const items = db.prepare('SELECT * FROM budget_items WHERE month_id = ?').all(monthId) as BudgetItem[];

  let totalBudgetedIncome = 0;
  let totalActualIncome = 0;
  let totalBudgetedExpenses = 0;
  let totalActualExpenses = 0;

  const expenseCategoryMap: Record<string, { budgeted: number; actual: number }> = {};

  for (const item of items) {
    if (item.type === 'income') {
      totalBudgetedIncome += item.budgeted_amount;
      totalActualIncome += item.actual_amount;
    } else {
      totalBudgetedExpenses += item.budgeted_amount;
      totalActualExpenses += item.actual_amount;

      if (!expenseCategoryMap[item.category]) {
        expenseCategoryMap[item.category] = { budgeted: 0, actual: 0 };
      }
      expenseCategoryMap[item.category].budgeted += item.budgeted_amount;
      expenseCategoryMap[item.category].actual += item.actual_amount;
    }
  }

  const expenseCategories: CategorySummary[] = Object.entries(expenseCategoryMap).map(([category, vals]) => ({
    category,
    budgeted: vals.budgeted,
    actual: vals.actual,
    difference: vals.budgeted - vals.actual,
  })).sort((a, b) => b.actual - a.actual);

  return {
    totalBudgetedIncome,
    totalActualIncome,
    totalBudgetedExpenses,
    totalActualExpenses,
    netBudgetedSavings: totalBudgetedIncome - totalBudgetedExpenses,
    netActualSavings: totalActualIncome - totalActualExpenses,
    expenseCategories,
  };
}
