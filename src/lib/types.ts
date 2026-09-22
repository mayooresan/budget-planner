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
