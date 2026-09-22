import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'budget.db');

const globalForDb = globalThis as unknown as { sqliteDb: Database.Database | undefined };

const DEFAULT_TEMPLATES = [
  // Incomes
  { type: 'income', category: 'Salary', name: 'Salary', default_budgeted_amount: 5000, sort_order: 1 },
  { type: 'income', category: 'Other Income', name: 'Freelance / Side Income', default_budgeted_amount: 0, sort_order: 2 },
  // Expenses
  { type: 'expense', category: 'Housing', name: 'Rent / Mortgage', default_budgeted_amount: 1500, sort_order: 1 },
  { type: 'expense', category: 'Food', name: 'Groceries', default_budgeted_amount: 600, sort_order: 2 },
  { type: 'expense', category: 'Utilities', name: 'Utilities (Electric, Water, Internet)', default_budgeted_amount: 250, sort_order: 3 },
  { type: 'expense', category: 'Food', name: 'Dining Out', default_budgeted_amount: 200, sort_order: 4 },
  { type: 'expense', category: 'Transportation', name: 'Transportation / Gas', default_budgeted_amount: 150, sort_order: 5 },
  { type: 'expense', category: 'Entertainment', name: 'Entertainment & Subscriptions', default_budgeted_amount: 100, sort_order: 6 },
];

export function initDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS months (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      default_budgeted_amount REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      budgeted_amount REAL NOT NULL DEFAULT 0,
      actual_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_budget_items_month ON budget_items(month_id);
  `);

  // Seed default template if empty
  const count = db.prepare('SELECT count(*) as count FROM template_items').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO template_items (type, category, name, default_budgeted_amount, sort_order)
      VALUES (@type, @category, @name, @default_budgeted_amount, @sort_order)
    `);
    const insertMany = db.transaction((items: typeof DEFAULT_TEMPLATES) => {
      for (const item of items) insert.run(item);
    });
    insertMany(DEFAULT_TEMPLATES);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.sqliteDb) {
    globalForDb.sqliteDb = initDb();
  }
  return globalForDb.sqliteDb;
}
