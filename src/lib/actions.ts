'use server';

import { getDb } from './db';
import { BudgetItem, TemplateItem, ItemType } from './types';
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
} from './budget-service';

export async function getOrCreateMonth(monthId: string) {
  return getOrCreateMonthWithDb(getDb(), monthId);
}

export async function listMonths() {
  return listMonthsWithDb(getDb());
}

export async function addBudgetItem(data: {
  month_id: string;
  type: ItemType;
  category: string;
  name: string;
  budgeted_amount: number;
  actual_amount?: number;
  notes?: string;
}) {
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
