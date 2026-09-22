# Monthly Budget Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, responsive web-based monthly financial expense tracking and budget planning system powered by Next.js and SQLite (`better-sqlite3`), featuring auto-populating monthly templates, budget vs. actual tracking, interactive charts, and CSV data export/import.

**Architecture:** Next.js App Router fullstack application. Direct server-side SQLite integration using `better-sqlite3` inside Next.js Server Actions and Route Handlers for high performance and zero ORM overhead. Responsive dashboard built with Tailwind CSS, Lucide icons, and Recharts for dynamic visual breakdown.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, `better-sqlite3`, Tailwind CSS, `recharts`, `lucide-react`, `papaparse`.

**Spec:** [docs/superpowers/specs/2026-09-22-monthly-budget-planner-design.md](file:///Users/test/Documents/devexp/monthly-planner/docs/superpowers/specs/2026-09-22-monthly-budget-planner-design.md)

## Global Constraints
- Database file path: `./data/budget.db` with SQLite WAL mode enabled.
- Month format: strictly `YYYY-MM` (e.g., `2026-09`).
- Item types: strictly `'income' | 'expense'`.
- Amounts: numeric values $\ge 0$.
- No external cloud services or databases required; runs completely offline and locally.

---

### Task 1: Next.js Project Scaffolding & Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `next.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Test: `package.json`

**Interfaces:**
- Produces: Runnable Next.js project skeleton with TypeScript, Tailwind CSS, and all necessary dependencies.

- [ ] **Step 1: Create `package.json` with dependencies**

```json
{
  "name": "monthly-planner",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test tests/**/*.test.js tests/**/*.test.ts"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "^14.2.23",
    "papaparse": "^5.5.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^20.17.19",
    "@types/papaparse": "^5.3.15",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`, `next.config.js`, `postcss.config.js`, and `tailwind.config.ts`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    return config;
  },
};

module.exports = nextConfig;
```

`postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Create `src/app/globals.css` and `src/app/layout.tsx`**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  color: #1f2937;
  background-color: #f9fafb;
}
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monthly Budget Planner",
  description: "Plan and track monthly expenses and budget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Install dependencies and verify build setup**

Run: `npm install`
Expected: Dependencies installed with clean exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.js postcss.config.js tailwind.config.ts src/app/globals.css src/app/layout.tsx
git commit -m "chore: scaffold Next.js project with TypeScript, Tailwind, and dependencies"
```

---

### Task 2: Database Layer & Data Modeling

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/db.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Produces:
  - `export interface Month { id: string; year: number; month: number; created_at: string; }`
  - `export interface BudgetItem { id: number; month_id: string; type: 'income' | 'expense'; category: string; name: string; budgeted_amount: number; actual_amount: number; notes?: string; sort_order: number; }`
  - `export interface TemplateItem { id: number; type: 'income' | 'expense'; category: string; name: string; default_budgeted_amount: number; sort_order: number; }`
  - `export function getDb(): Database`
  - `export function initDb(dbPath?: string): Database`

- [ ] **Step 1: Write `src/lib/types.ts`**

```typescript
export type ItemType = 'income' | 'expense';

export interface Month {
  id: string; // YYYY-MM
  year: number;
  month: number;
  created_at: string;
}

export interface BudgetItem {
  id: number;
  month_id: string;
  type: ItemType;
  category: string;
  name: string;
  budgeted_amount: number;
  actual_amount: number;
  notes: string | null;
  sort_order: number;
}

export interface TemplateItem {
  id: number;
  type: ItemType;
  category: string;
  name: string;
  default_budgeted_amount: number;
  sort_order: number;
}

export interface CategorySummary {
  category: string;
  budgeted: number;
  actual: number;
  difference: number;
}

export interface MonthAnalytics {
  totalBudgetedIncome: number;
  totalActualIncome: number;
  totalBudgetedExpenses: number;
  totalActualExpenses: number;
  netBudgetedSavings: number;
  netActualSavings: number;
  expenseCategories: CategorySummary[];
}
```

- [ ] **Step 2: Write failing test `tests/db.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { initDb } from '../src/lib/db';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_budget.db');

test('Database initialization and template seeding', () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = initDb(TEST_DB_PATH);
  
  // Verify tables exist
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];
  const tableNames = tables.map(t => t.name);
  assert.ok(tableNames.includes('months'), 'months table should exist');
  assert.ok(tableNames.includes('template_items'), 'template_items table should exist');
  assert.ok(tableNames.includes('budget_items'), 'budget_items table should exist');

  // Verify default seed data in template_items
  const templateCount = db.prepare(`SELECT count(*) as count FROM template_items`).get() as { count: number };
  assert.ok(templateCount.count > 0, 'template_items should be seeded');

  db.close();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx tests/db.test.ts`
Expected: FAIL (cannot find module `../src/lib/db`)

- [ ] **Step 4: Implement `src/lib/db.ts`**

```typescript
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'budget.db');

let dbInstance: Database.Database | null = null;

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
    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    insertMany(DEFAULT_TEMPLATES);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx tests/db.test.ts`
Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts tests/db.test.ts
git commit -m "feat: implement database schema, initialization, and template seeding"
```

---

### Task 3: Backend Actions & Logic

**Files:**
- Create: `src/lib/actions.ts`
- Test: `tests/actions.test.ts`

**Interfaces:**
- Produces:
  - `export async function getOrCreateMonth(monthId: string): Promise<{ month: Month; items: BudgetItem[] }>`
  - `export async function listMonths(): Promise<Month[]>`
  - `export async function addBudgetItem(data: { month_id: string; type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount?: number; notes?: string }): Promise<BudgetItem>`
  - `export async function updateBudgetItem(id: number, data: Partial<Omit<BudgetItem, 'id' | 'month_id'>>): Promise<BudgetItem>`
  - `export async function deleteBudgetItem(id: number): Promise<void>`
  - `export async function getTemplateItems(): Promise<TemplateItem[]>`
  - `export async function updateTemplateItem(id: number, data: Partial<Omit<TemplateItem, 'id'>>): Promise<TemplateItem>`
  - `export async function addTemplateItem(data: Omit<TemplateItem, 'id'>): Promise<TemplateItem>`
  - `export async function deleteTemplateItem(id: number): Promise<void>`
  - `export async function getMonthAnalytics(monthId: string): Promise<MonthAnalytics>`

- [ ] **Step 1: Write failing test `tests/actions.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { initDb } from '../src/lib/db';
import {
  getOrCreateMonthWithDb,
  addBudgetItemWithDb,
  updateBudgetItemWithDb,
  deleteBudgetItemWithDb,
  getMonthAnalyticsWithDb,
} from '../src/lib/actions';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_actions.db');

test('Month creation, auto-population, and item CRUD', async () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const db = initDb(TEST_DB_PATH);

  // 1. Test getOrCreateMonth
  const { month, items } = getOrCreateMonthWithDb(db, '2026-09');
  assert.strictEqual(month.id, '2026-09');
  assert.strictEqual(month.year, 2026);
  assert.strictEqual(month.month, 9);
  assert.ok(items.length > 0, 'Items should be auto-populated from template');
  const salaryItem = items.find(i => i.name === 'Salary');
  assert.ok(salaryItem, 'Salary item should exist');
  assert.strictEqual(salaryItem?.budgeted_amount, 5000);
  assert.strictEqual(salaryItem?.actual_amount, 0);

  // 2. Add custom item
  const customItem = addBudgetItemWithDb(db, {
    month_id: '2026-09',
    type: 'expense',
    category: 'Subscription',
    name: 'Streaming Service',
    budgeted_amount: 15,
    actual_amount: 15,
  });
  assert.strictEqual(customItem.name, 'Streaming Service');

  // 3. Update item
  const updated = updateBudgetItemWithDb(db, salaryItem!.id, { actual_amount: 5200 });
  assert.strictEqual(updated.actual_amount, 5200);

  // 4. Analytics calculation
  const analytics = getMonthAnalyticsWithDb(db, '2026-09');
  assert.strictEqual(analytics.totalBudgetedIncome, 5000);
  assert.strictEqual(analytics.totalActualIncome, 5200);
  assert.ok(analytics.expenseCategories.length > 0);

  // 5. Delete item
  deleteBudgetItemWithDb(db, customItem.id);
  const itemsAfterDelete = db.prepare('SELECT * FROM budget_items WHERE month_id = ?').all('2026-09') as any[];
  assert.strictEqual(itemsAfterDelete.some(i => i.id === customItem.id), false);

  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/actions.test.ts`
Expected: FAIL (cannot find module `../src/lib/actions`)

- [ ] **Step 3: Implement `src/lib/actions.ts`**

```typescript
import Database from 'better-sqlite3';
import { getDb } from './db';
import { Month, BudgetItem, TemplateItem, MonthAnalytics, CategorySummary, ItemType } from './types';

// Pure helper functions that accept a db instance (for testability)
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
    data.category.trim() || 'General',
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

  const type = data.type ?? existing.type;
  const category = data.category !== undefined ? data.category.trim() : existing.category;
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const budgeted_amount = data.budgeted_amount !== undefined ? Math.max(0, Number(data.budgeted_amount)) : existing.budgeted_amount;
  const actual_amount = data.actual_amount !== undefined ? Math.max(0, Number(data.actual_amount)) : existing.actual_amount;
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
  const result = db.prepare(`
    INSERT INTO template_items (type, category, name, default_budgeted_amount, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.type, data.category.trim() || 'General', data.name.trim(), Math.max(0, Number(data.default_budgeted_amount) || 0), data.sort_order || 0);

  return db.prepare('SELECT * FROM template_items WHERE id = ?').get(result.lastInsertRowid) as TemplateItem;
}

export function updateTemplateItemWithDb(db: Database.Database, id: number, data: Partial<Omit<TemplateItem, 'id'>>): TemplateItem {
  const existing = db.prepare('SELECT * FROM template_items WHERE id = ?').get(id) as TemplateItem | undefined;
  if (!existing) throw new Error(`Template item #${id} not found`);

  const type = data.type ?? existing.type;
  const category = data.category !== undefined ? data.category.trim() : existing.category;
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const default_budgeted_amount = data.default_budgeted_amount !== undefined ? Math.max(0, Number(data.default_budgeted_amount)) : existing.default_budgeted_amount;
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

// Next.js Server Actions wrapping singleton db
export async function getOrCreateMonth(monthId: string) {
  return getOrCreateMonthWithDb(getDb(), monthId);
}

export async function listMonths() {
  return listMonthsWithDb(getDb());
}

export async function addBudgetItem(data: { month_id: string; type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount?: number; notes?: string }) {
  return addBudgetItemWithDb(getDb(), data);
}

export async function updateBudgetItem(id: number, data: Partial<Omit<BudgetItem, 'id' | 'month_id'>>) {
  return updateBudgetItemWithDb(getDb(), id, data);
}

export async function deleteBudgetItem(id: number) {
  return deleteBudgetItemWithDb(getDb(), id);
}

export async function getTemplateItems() {
  return getTemplateItemsWithDb(getDb());
}

export async function addTemplateItem(data: Omit<TemplateItem, 'id'>) {
  return addTemplateItemWithDb(getDb(), data);
}

export async function updateTemplateItem(id: number, data: Partial<Omit<TemplateItem, 'id'>>) {
  return updateTemplateItemWithDb(getDb(), id, data);
}

export async function deleteTemplateItem(id: number) {
  return deleteTemplateItemWithDb(getDb(), id);
}

export async function getMonthAnalytics(monthId: string) {
  return getMonthAnalyticsWithDb(getDb(), monthId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/actions.test.ts`
Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions.ts tests/actions.test.ts
git commit -m "feat: implement backend actions for month lifecycle, item CRUD, and analytics"
```

---

### Task 4: CSV Export & Import Endpoints

**Files:**
- Create: `src/app/api/export/route.ts`
- Create: `src/app/api/import/route.ts`
- Test: `tests/csv.test.ts`

**Interfaces:**
- Produces:
  - `GET /api/export?month=all` or `GET /api/export?month=YYYY-MM`: Returns CSV file attachment
  - `POST /api/import`: Accepts `multipart/form-data` with `.csv` file, returns `{ success: boolean, importedCount: number }`

- [ ] **Step 1: Write failing test `tests/csv.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { initDb } from '../src/lib/db';
import { getOrCreateMonthWithDb } from '../src/lib/actions';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_csv.db');

test('CSV data export structure and import parsing', () => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
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
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});
```

- [ ] **Step 2: Run test to verify CSV logic**

Run: `npx tsx tests/csv.test.ts`
Expected: PASS

- [ ] **Step 3: Implement `src/app/api/export/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'all';

    const db = getDb();
    let query = `
      SELECT month_id as month, type, category, name, budgeted_amount, actual_amount, COALESCE(notes, '') as notes
      FROM budget_items
    `;
    const params: string[] = [];

    if (month !== 'all') {
      query += ' WHERE month_id = ?';
      params.push(month);
    }
    query += ' ORDER BY month_id DESC, type DESC, sort_order ASC, id ASC';

    const items = db.prepare(query).all(...params);
    const csv = Papa.unparse(items, { header: true });

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
```

- [ ] **Step 4: Implement `src/app/api/import/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

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

        const type = row.type === 'income' ? 'income' : 'expense';
        const category = String(row.category || 'General').trim();
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
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/export/route.ts src/app/api/import/route.ts tests/csv.test.ts
git commit -m "feat: implement CSV export and import API routes"
```

---

### Task 5: UI Components - Header, Month Picker, and KPI Cards

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/KpiCards.tsx`

**Interfaces:**
- `HeaderProps`:
  - `currentMonth: string`
  - `onMonthChange: (month: string) => void`
  - `onOpenSettings: () => void`
  - `onOpenCsvModal: () => void`
- `KpiCardsProps`:
  - `analytics: MonthAnalytics`

- [ ] **Step 1: Implement `src/components/Header.tsx`**

```tsx
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Settings, FileSpreadsheet, Calendar } from 'lucide-react';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenSettings: () => void;
  onOpenCsvModal: () => void;
}

export default function Header({
  currentMonth,
  onMonthChange,
  onOpenSettings,
  onOpenCsvModal,
}: HeaderProps) {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1);
  const formattedMonthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrev = () => {
    const prevDate = new Date(year, month - 2);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(prevMonthStr);
  };

  const handleNext = () => {
    const nextDate = new Date(year, month);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(nextMonthStr);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow">
            $
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Monthly Budget Planner</h1>
            <p className="text-xs text-gray-500">Plan and track your expenses</p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 shadow-inner">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:text-gray-900"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 px-3 font-semibold text-gray-800">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => e.target.value && onMonthChange(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 text-sm focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNext}
            className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:text-gray-900"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCsvModal}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-gray-500" />
            <span>CSV Data</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Default Template</span>
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement `src/components/KpiCards.tsx`**

```tsx
'use client';

import React from 'react';
import { MonthAnalytics } from '@/lib/types';
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardsProps {
  analytics: MonthAnalytics;
}

export default function KpiCards({ analytics }: KpiCardsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const incomeDiff = analytics.totalActualIncome - analytics.totalBudgetedIncome;
  const expenseDiff = analytics.totalActualExpenses - analytics.totalBudgetedExpenses;
  const savingsRate = analytics.totalActualIncome > 0
    ? Math.round((analytics.netActualSavings / analytics.totalActualIncome) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Income Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Income</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalActualIncome)}</div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Planned: {formatCurrency(analytics.totalBudgetedIncome)}</span>
            <span className={`flex items-center font-medium ${incomeDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {incomeDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff)}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Expenses</span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalActualExpenses)}</div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Budgeted: {formatCurrency(analytics.totalBudgetedExpenses)}</span>
            <span className={`flex items-center font-medium ${expenseDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {expenseDiff <= 0 ? 'Under by ' : 'Over by '}
              {formatCurrency(Math.abs(expenseDiff))}
            </span>
          </div>
        </div>
      </div>

      {/* Net Savings Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Net Savings</span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className={`text-2xl font-bold ${analytics.netActualSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatCurrency(analytics.netActualSavings)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Planned: {formatCurrency(analytics.netBudgetedSavings)}</span>
            <span className="font-semibold text-gray-700">Rate: {savingsRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx src/components/KpiCards.tsx
git commit -m "feat: create Header with month navigation and KPI summary cards"
```

---

### Task 6: UI Components - Interactive Charts

**Files:**
- Create: `src/components/Charts.tsx`

**Interfaces:**
- `ChartsProps`:
  - `analytics: MonthAnalytics`

- [ ] **Step 1: Implement `src/components/Charts.tsx`**

```tsx
'use client';

import React from 'react';
import { MonthAnalytics } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartsProps {
  analytics: MonthAnalytics;
}

const COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export default function Charts({ analytics }: ChartsProps) {
  const expenseData = analytics.expenseCategories
    .filter((cat) => cat.actual > 0)
    .map((cat) => ({
      name: cat.category,
      value: cat.actual,
    }));

  const barData = analytics.expenseCategories.map((cat) => ({
    name: cat.category,
    Budgeted: cat.budgeted,
    Actual: cat.actual,
  }));

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut Chart: Expense Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
        <h2 className="text-base font-bold text-gray-900 mb-1">Expense Breakdown</h2>
        <p className="text-xs text-gray-500 mb-4">Where your money is going by category</p>

        {expenseData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[260px] text-sm text-gray-400">
            No actual expenses recorded for this month yet
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Spent']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bar Chart: Budget vs Actual */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
        <h2 className="text-base font-bold text-gray-900 mb-1">Budget vs. Actual Spending</h2>
        <p className="text-xs text-gray-500 mb-4">Comparison per expense category</p>

        {barData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[260px] text-sm text-gray-400">
            No expense categories to display
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val)]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB' }}
                />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="Budgeted" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Charts.tsx
git commit -m "feat: implement dynamic expense breakdown donut chart and budget vs actual bar chart"
```

---

### Task 7: UI Components - Budget Tables & In-Place Editing

**Files:**
- Create: `src/components/BudgetTable.tsx`
- Create: `src/components/AddItemModal.tsx`

**Interfaces:**
- `BudgetTableProps`:
  - `title: string`
  - `type: ItemType`
  - `items: BudgetItem[]`
  - `onUpdateItem: (id: number, data: Partial<BudgetItem>) => Promise<void>`
  - `onDeleteItem: (id: number) => Promise<void>`
  - `onOpenAddModal: (type: ItemType) => void`
- `AddItemModalProps`:
  - `isOpen: boolean`
  - `defaultType: ItemType`
  - `onClose: () => void`
  - `onAdd: (data: { type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount: number }) => Promise<void>`

- [ ] **Step 1: Implement `src/components/BudgetTable.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { BudgetItem, ItemType } from '@/lib/types';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

interface BudgetTableProps {
  title: string;
  type: ItemType;
  items: BudgetItem[];
  onUpdateItem: (id: number, data: Partial<BudgetItem>) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onOpenAddModal: (type: ItemType) => void;
}

export default function BudgetTable({
  title,
  type,
  items,
  onUpdateItem,
  onDeleteItem,
  onOpenAddModal,
}: BudgetTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetItem>>({});

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      category: item.category,
      budgeted_amount: item.budgeted_amount,
      actual_amount: item.actual_amount,
    });
  };

  const saveEdit = async (id: number) => {
    await onUpdateItem(id, editForm);
    setEditingId(null);
  };

  const totalBudgeted = items.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual_amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <button
          onClick={() => onOpenAddModal(type)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
            type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add {type === 'income' ? 'Income' : 'Expense'}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Budgeted</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Diff</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const isEditing = editingId === item.id;
              const diff = type === 'income' ? item.actual_amount - item.budgeted_amount : item.budgeted_amount - item.actual_amount;

              return (
                <tr key={item.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.category ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                      />
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        value={editForm.budgeted_amount ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, budgeted_amount: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-24 text-right"
                      />
                    ) : (
                      formatCurrency(item.budgeted_amount)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        value={editForm.actual_amount ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, actual_amount: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-24 text-right"
                      />
                    ) : (
                      formatCurrency(item.actual_amount)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium">
                    <span className={diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {isEditing ? (
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50/80 font-bold border-t border-gray-200">
            <tr>
              <td className="px-6 py-3 text-gray-900">Total</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(totalBudgeted)}</td>
              <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalActual)}</td>
              <td className="px-4 py-3 text-right text-xs">
                {formatCurrency(type === 'income' ? totalActual - totalBudgeted : totalBudgeted - totalActual)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/AddItemModal.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { ItemType } from '@/lib/types';
import { X } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  defaultType: ItemType;
  onClose: () => void;
  onAdd: (data: { type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount: number }) => Promise<void>;
}

export default function AddItemModal({
  isOpen,
  defaultType,
  onClose,
  onAdd,
}: AddItemModalProps) {
  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [budgeted, setBudgeted] = useState<number>(0);
  const [actual, setActual] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        type,
        name: name.trim(),
        category: category.trim() || 'General',
        budgeted_amount: budgeted,
        actual_amount: actual,
      });
      setName('');
      setCategory('');
      setBudgeted(0);
      setActual(0);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add Budget Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-x-0 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
                  type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
                  type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Bill, Consulting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
            <input
              type="text"
              placeholder="e.g. Utilities, Food, Housing"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Budgeted ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={budgeted}
                onChange={(e) => setBudgeted(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Actual ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={actual}
                onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BudgetTable.tsx src/components/AddItemModal.tsx
git commit -m "feat: implement budget item tables with in-place editing and add item modal"
```

---

### Task 8: UI Components - Template Settings & CSV Modals

**Files:**
- Create: `src/components/TemplateModal.tsx`
- Create: `src/components/CsvDataModal.tsx`

**Interfaces:**
- `TemplateModalProps`:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onTemplatesChanged: () => void`
- `CsvDataModalProps`:
  - `isOpen: boolean`
  - `currentMonth: string`
  - `onClose: () => void`
  - `onImportSuccess: () => void`

- [ ] **Step 1: Implement `src/components/TemplateModal.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TemplateItem, ItemType } from '@/lib/types';
import { getTemplateItems, addTemplateItem, updateTemplateItem, deleteTemplateItem } from '@/lib/actions';
import { X, Plus, Trash2, Check, Edit2 } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesChanged?: () => void;
}

export default function TemplateModal({ isOpen, onClose, onTemplatesChanged }: TemplateModalProps) {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<TemplateItem>>({});
  
  // New item form state
  const [newType, setNewType] = useState<ItemType>('expense');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);

  const loadTemplates = async () => {
    const list = await getTemplateItems();
    setItems(list);
  };

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addTemplateItem({
      type: newType,
      category: newCategory.trim() || 'General',
      name: newName.trim(),
      default_budgeted_amount: newAmount,
      sort_order: items.length + 1,
    });
    setNewName('');
    setNewCategory('');
    setNewAmount(0);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  const handleSaveEdit = async (id: number) => {
    await updateTemplateItem(id, editForm);
    setEditingId(null);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  const handleDelete = async (id: number) => {
    await deleteTemplateItem(id);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Default Monthly Template</h3>
            <p className="text-xs text-gray-500">Items configured here automatically populate any new month you select</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new template row */}
        <form onSubmit={handleAddNew} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as ItemType)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="text"
            required
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
          <input
            type="text"
            placeholder="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
          <input
            type="number"
            step="any"
            placeholder="Default $"
            value={newAmount || ''}
            onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-right"
          />
          <button
            type="submit"
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* List of template items */}
        <div className="flex-1 overflow-y-auto mt-4 border border-gray-100 rounded-xl">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Default Amount</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded font-semibold ${item.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        item.category
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900 text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={editForm.default_budgeted_amount ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, default_budgeted_amount: parseFloat(e.target.value) || 0 })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-20 text-right"
                        />
                      ) : (
                        `$${item.default_budgeted_amount.toLocaleString()}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditForm(item);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-4 mt-auto border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/CsvDataModal.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { X, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface CsvDataModalProps {
  isOpen: boolean;
  currentMonth: string;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function CsvDataModal({
  isOpen,
  currentMonth,
  onClose,
  onImportSuccess,
}: CsvDataModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = (all: boolean) => {
    const url = all ? '/api/export?month=all' : `/api/export?month=${currentMonth}`;
    window.open(url, '_blank');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV');
      }

      setMessage({ type: 'success', text: `Successfully imported ${data.importedCount} items!` });
      setFile(null);
      onImportSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Import error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Backup & Restore (CSV)</h3>
            <p className="text-xs text-gray-500">Export or import your SQLite budget data</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Export Data</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExport(false)}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export {currentMonth}</span>
            </button>
            <button
              onClick={() => handleExport(true)}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export All Months</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Import Data</h4>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Importing...' : 'Upload & Import CSV'}</span>
            </button>
          </form>

          {message && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TemplateModal.tsx src/components/CsvDataModal.tsx
git commit -m "feat: implement default template manager and CSV export/import modals"
```

---

### Task 9: Main Page Integration & End-to-End Verification

**Files:**
- Create: `src/app/page.tsx`
- Test: Manual verification with running dev server

**Interfaces:**
- Produces: Integrated full-page dashboard combining Header, KpiCards, Charts, Incomes and Expenses tables, and Modals.

- [ ] **Step 1: Implement `src/app/page.tsx`**

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import KpiCards from '@/components/KpiCards';
import Charts from '@/components/Charts';
import BudgetTable from '@/components/BudgetTable';
import AddItemModal from '@/components/AddItemModal';
import TemplateModal from '@/components/TemplateModal';
import CsvDataModal from '@/components/CsvDataModal';
import { BudgetItem, MonthAnalytics, ItemType } from '@/lib/types';
import {
  getOrCreateMonth,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getMonthAnalytics,
} from '@/lib/actions';

export default function Dashboard() {
  // Current month defaults to current year-month
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [analytics, setAnalytics] = useState<MonthAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<ItemType>('expense');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const loadMonthData = useCallback(async (monthId: string) => {
    setIsLoading(true);
    try {
      const res = await getOrCreateMonth(monthId);
      const stats = await getMonthAnalytics(monthId);
      setItems(res.items);
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed to load month data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth, loadMonthData]);

  const handleUpdateItem = async (id: number, data: Partial<BudgetItem>) => {
    await updateBudgetItem(id, data);
    await loadMonthData(currentMonth);
  };

  const handleDeleteItem = async (id: number) => {
    await deleteBudgetItem(id);
    await loadMonthData(currentMonth);
  };

  const handleAddItem = async (data: {
    type: ItemType;
    category: string;
    name: string;
    budgeted_amount: number;
    actual_amount: number;
  }) => {
    await addBudgetItem({
      month_id: currentMonth,
      type: data.type,
      category: data.category,
      name: data.name,
      budgeted_amount: data.budgeted_amount,
      actual_amount: data.actual_amount,
    });
    await loadMonthData(currentMonth);
  };

  const openAddModal = (type: ItemType) => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const incomeItems = items.filter((i) => i.type === 'income');
  const expenseItems = items.filter((i) => i.type === 'expense');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentMonth={currentMonth}
        onMonthChange={(m) => setCurrentMonth(m)}
        onOpenSettings={() => setIsTemplateModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {analytics && <KpiCards analytics={analytics} />}

        {analytics && <Charts analytics={analytics} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <BudgetTable
            title="Incomes"
            type="income"
            items={incomeItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onOpenAddModal={openAddModal}
          />

          <BudgetTable
            title="Expenses"
            type="expense"
            items={expenseItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onOpenAddModal={openAddModal}
          />
        </div>
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        defaultType={addModalType}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />

      <CsvDataModal
        isOpen={isCsvModalOpen}
        currentMonth={currentMonth}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={() => loadMonthData(currentMonth)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run build and tests to verify everything compiles cleanly**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble main dashboard integrating all budget components and modals"
```
