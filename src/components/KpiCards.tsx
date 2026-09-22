'use client';

import React from 'react';
import { MonthAnalytics } from '@/lib/types';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

interface KpiCardsProps {
  analytics: MonthAnalytics;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function KpiCards({ analytics }: KpiCardsProps) {
  const formatCurrency = (val: number) => currencyFormatter.format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Income Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Planned Income</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalIncome)}</div>
          <p className="text-xs text-gray-500 mt-1">Total expected earnings this month</p>
        </div>
      </div>

      {/* Expense Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Planned Expenses</span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalExpenses)}</div>
          <p className="text-xs text-gray-500 mt-1">Total planned expenses this month</p>
        </div>
      </div>

      {/* Net Savings / Balance Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Planned Balance / Savings</span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className={`text-2xl font-bold ${analytics.netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatCurrency(analytics.netSavings)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>Savings Rate: <strong className="text-gray-700">{analytics.savingsRate}%</strong></span>
            <span className={analytics.netSavings >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
              {analytics.netSavings >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
