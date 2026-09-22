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
  resetMonthToTemplate,
} from '@/lib/actions';


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
              <div className="flex justify-between items-center pt-1">
                <div className="h-3 w-24 bg-gray-100 rounded"></div>
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
          <div className="h-5 w-44 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-50 rounded-xl flex items-end justify-around p-4 gap-2">
            <div className="w-10 bg-gray-200 rounded-t h-28"></div>
            <div className="w-10 bg-gray-200 rounded-t h-44"></div>
            <div className="w-10 bg-gray-200 rounded-t h-24"></div>
            <div className="w-10 bg-gray-200 rounded-t h-36"></div>
            <div className="w-10 bg-gray-200 rounded-t h-16"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
          <div className="h-5 w-44 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-8 border-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="h-6 w-28 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-10 bg-gray-50 rounded w-full"></div>
              <div className="h-10 bg-gray-50 rounded w-full"></div>
              <div className="h-10 bg-gray-50 rounded w-full"></div>
              <div className="h-10 bg-gray-50 rounded w-full"></div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  }) => {
    await addBudgetItem({
      month_id: currentMonth,
      type: data.type,
      category: data.category,
      name: data.name,
      budgeted_amount: data.budgeted_amount,
    });
    await loadMonthData(currentMonth);
  };

  const handleResetMonth = async () => {
    await resetMonthToTemplate(currentMonth);
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
        onResetMonth={handleResetMonth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
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
          </>
        )}
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
        currentMonth={currentMonth}
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
