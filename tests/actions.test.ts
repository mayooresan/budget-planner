import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { initDb } from '../src/lib/db';
import {
  getOrCreateMonthWithDb,
  listMonthsWithDb,
  addBudgetItemWithDb,
  updateBudgetItemWithDb,
  deleteBudgetItemWithDb,
  getTemplateItemsWithDb,
  addTemplateItemWithDb,
  updateTemplateItemWithDb,
  deleteTemplateItemWithDb,
  getMonthAnalyticsWithDb,
  setMonthAsTemplateWithDb,
  resetMonthToTemplateWithDb,
} from '../src/lib/budget-service';
import {
  getOrCreateMonth,
  listMonths,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getTemplateItems,
  addTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  getMonthAnalytics,
  setMonthAsTemplate,
  resetMonthToTemplate,
} from '../src/lib/actions';


const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_actions.db');

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

test('Month creation, auto-population, item CRUD, templates, and analytics', async () => {
  cleanTestDb(TEST_DB_PATH);
  const db = initDb(TEST_DB_PATH);

  // 1. Test getOrCreateMonthWithDb
  const { month, items } = getOrCreateMonthWithDb(db, '2026-09');
  assert.strictEqual(month.id, '2026-09');
  assert.strictEqual(month.year, 2026);
  assert.strictEqual(month.month, 9);
  assert.ok(items.length > 0, 'Items should be auto-populated from template');
  const salaryItem = items.find(i => i.name === 'Salary');
  assert.ok(salaryItem, 'Salary item should exist');
  assert.strictEqual(salaryItem?.budgeted_amount, 5000);
  assert.strictEqual(salaryItem?.actual_amount, 0);

  // Calling again should return existing month without duplicating items
  const secondCall = getOrCreateMonthWithDb(db, '2026-09');
  assert.strictEqual(secondCall.month.id, '2026-09');
  assert.strictEqual(secondCall.items.length, items.length);

  // Invalid month format should throw
  assert.throws(() => {
    getOrCreateMonthWithDb(db, 'invalid-date');
  }, /Invalid month format/);
  assert.throws(() => {
    getOrCreateMonthWithDb(db, '2026-9');
  }, /Invalid month format/);

  // 2. Test listMonthsWithDb
  getOrCreateMonthWithDb(db, '2026-10');
  const months = listMonthsWithDb(db);
  assert.strictEqual(months.length, 2);
  assert.strictEqual(months[0].id, '2026-10', 'Months should be sorted DESC');
  assert.strictEqual(months[1].id, '2026-09');

  // 3. Add custom budget item
  const customItem = addBudgetItemWithDb(db, {
    month_id: '2026-09',
    type: 'expense',
    category: 'Subscription',
    name: 'Streaming Service',
    budgeted_amount: 15,
    actual_amount: 15,
  });
  assert.strictEqual(customItem.name, 'Streaming Service');
  assert.strictEqual(customItem.category, 'Subscription');
  assert.strictEqual(customItem.budgeted_amount, 15);
  assert.strictEqual(customItem.actual_amount, 15);
  assert.ok(customItem.sort_order > 0);

  // Validation: empty item name should throw
  assert.throws(() => {
    addBudgetItemWithDb(db, {
      month_id: '2026-09',
      type: 'expense',
      category: 'Food',
      name: '   ',
      budgeted_amount: 10,
    });
  }, /Item name is required/);

  // 4. Update budget item
  const updated = updateBudgetItemWithDb(db, salaryItem!.id, { actual_amount: 5200 });
  assert.strictEqual(updated.actual_amount, 5200);

  // Empty name on update should throw
  assert.throws(() => {
    updateBudgetItemWithDb(db, salaryItem!.id, { name: '   ' });
  }, /Item name cannot be empty/);

  // Amount sanitization on update
  const sanitized = updateBudgetItemWithDb(db, salaryItem!.id, { budgeted_amount: -50, actual_amount: NaN as any });
  assert.strictEqual(sanitized.budgeted_amount, 0);
  assert.strictEqual(sanitized.actual_amount, 0);

  // Restore salary item values for analytics
  updateBudgetItemWithDb(db, salaryItem!.id, { budgeted_amount: 5000, actual_amount: 5200 });

  // Updating non-existent item should throw
  assert.throws(() => {
    updateBudgetItemWithDb(db, 999999, { actual_amount: 100 });
  }, /not found/);

  // 5. Analytics calculation
  const analytics = getMonthAnalyticsWithDb(db, '2026-09');
  assert.strictEqual(analytics.totalIncome, 5000);
  assert.ok(analytics.expenseCategories.length > 0);
  assert.strictEqual(analytics.netSavings, analytics.totalIncome - analytics.totalExpenses);
  assert.ok(analytics.savingsRate >= 0 && analytics.savingsRate <= 100);

  // Check category summaries
  for (const cat of analytics.expenseCategories) {
    assert.ok(cat.amount >= 0);
    assert.ok(cat.percentage >= 0);
  }

  // 6. Delete budget item
  deleteBudgetItemWithDb(db, customItem.id);
  const itemsAfterDelete = db.prepare('SELECT * FROM budget_items WHERE month_id = ?').all('2026-09') as any[];
  assert.strictEqual(itemsAfterDelete.some(i => i.id === customItem.id), false);

  // 7. Template items CRUD & validations
  const initialTemplates = getTemplateItemsWithDb(db);
  assert.ok(initialTemplates.length > 0);

  // Validation: empty template name should throw on add
  assert.throws(() => {
    addTemplateItemWithDb(db, {
      type: 'expense',
      category: 'Insurance',
      name: '  ',
      default_budgeted_amount: 300,
      sort_order: 10,
    });
  }, /Template item name is required/);

  const newTemplate = addTemplateItemWithDb(db, {
    type: 'expense',
    category: 'Insurance',
    name: 'Health Insurance',
    default_budgeted_amount: 300,
    sort_order: 10,
  });
  assert.strictEqual(newTemplate.name, 'Health Insurance');
  assert.strictEqual(newTemplate.default_budgeted_amount, 300);

  // Validation: empty template name should throw on update
  assert.throws(() => {
    updateTemplateItemWithDb(db, newTemplate.id, { name: '  ' });
  }, /Template item name cannot be empty/);

  const updatedTemplate = updateTemplateItemWithDb(db, newTemplate.id, {
    default_budgeted_amount: 350,
  });
  assert.strictEqual(updatedTemplate.default_budgeted_amount, 350);

  assert.throws(() => {
    updateTemplateItemWithDb(db, 999999, { name: 'None' });
  }, /not found/);

  deleteTemplateItemWithDb(db, newTemplate.id);
  const templatesAfterDelete = getTemplateItemsWithDb(db);
  assert.strictEqual(templatesAfterDelete.some(t => t.id === newTemplate.id), false);

  db.close();
  cleanTestDb(TEST_DB_PATH);
});

test('Server Actions wrap singleton DB correctly', async () => {
  // Test async server actions calling default getDb()
  const { month, items } = await getOrCreateMonth('2026-11');
  assert.strictEqual(month.id, '2026-11');
  assert.ok(items.length > 0);

  const months = await listMonths();
  assert.ok(months.some(m => m.id === '2026-11'));

  const item = await addBudgetItem({
    month_id: '2026-11',
    type: 'income',
    category: 'Bonus',
    name: 'Year-end Bonus',
    budgeted_amount: 1000,
  });
  assert.strictEqual(item.name, 'Year-end Bonus');

  const updatedItem = await updateBudgetItem(item.id, { actual_amount: 1200 });
  assert.strictEqual(updatedItem.actual_amount, 1200);

  const analytics = await getMonthAnalytics('2026-11');
  assert.ok(analytics.totalIncome >= 1000);

  await deleteBudgetItem(item.id);

  const templates = await getTemplateItems();
  assert.ok(templates.length > 0);

  const addedTemplate = await addTemplateItem({
    type: 'expense',
    category: 'Pets',
    name: 'Vet Care',
    default_budgeted_amount: 50,
    sort_order: 20,
  });
  assert.strictEqual(addedTemplate.name, 'Vet Care');

  const updatedTemplate = await updateTemplateItem(addedTemplate.id, { default_budgeted_amount: 75 });
  assert.strictEqual(updatedTemplate.default_budgeted_amount, 75);

  await deleteTemplateItem(addedTemplate.id);
});

test('setMonthAsTemplate and resetMonthToTemplate functionality', async () => {
  const TEST_SET_RESET_DB = path.join(process.cwd(), 'data', 'test_set_reset.db');
  cleanTestDb(TEST_SET_RESET_DB);
  const db = initDb(TEST_SET_RESET_DB);

  // 1. Initialize a month
  const { items: initialItems } = getOrCreateMonthWithDb(db, '2026-12');
  assert.ok(initialItems.length > 0);

  // 2. Add custom item and modify budgeted amounts
  addBudgetItemWithDb(db, {
    month_id: '2026-12',
    type: 'expense',
    category: 'Custom Cat',
    name: 'Custom Gift',
    budgeted_amount: 300,
  });

  // 3. Set month as template
  const newTemplates = setMonthAsTemplateWithDb(db, '2026-12');
  const customGiftTemplate = newTemplates.find(t => t.name === 'Custom Gift');
  assert.ok(customGiftTemplate, 'Custom item should now be in default template');
  assert.strictEqual(customGiftTemplate?.default_budgeted_amount, 300);

  // 4. Test resetMonthToTemplate
  // Modify an item in 2026-12 or add another item that is not in template
  const tempItem = addBudgetItemWithDb(db, {
    month_id: '2026-12',
    type: 'expense',
    category: 'OneOff',
    name: 'Accidental Item',
    budgeted_amount: 999,
  });

  // Reset to template
  const resetItems = resetMonthToTemplateWithDb(db, '2026-12');
  assert.strictEqual(resetItems.some(i => i.name === 'Accidental Item'), false, 'Accidental item should be removed');
  assert.ok(resetItems.some(i => i.name === 'Custom Gift'), 'Custom Gift should be restored from template');

  db.close();
  cleanTestDb(TEST_SET_RESET_DB);
});

