'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Settings, FileSpreadsheet, Calendar, LogOut, RotateCcw } from 'lucide-react';
import { logoutAction } from '@/lib/auth-actions';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenSettings: () => void;
  onOpenCsvModal: () => void;
  onResetMonth: () => Promise<void>;
}

export default function Header({
  currentMonth,
  onMonthChange,
  onOpenSettings,
  onOpenCsvModal,
  onResetMonth,
}: HeaderProps) {

  const [year, month] = currentMonth.split('-').map(Number);

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

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to reset ${currentMonth} to the default template? All custom items and logged spending for this month will be cleared.`
    );
    if (!confirmed) return;
    await onResetMonth();
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
              aria-label="Select month"
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
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition shadow-sm"
            title="Reset this month to default template"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Reset Month</span>
          </button>
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
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-sm"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
