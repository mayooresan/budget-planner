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
        onTemplatesChanged={() => loadMonthData(currentMonth)}
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
