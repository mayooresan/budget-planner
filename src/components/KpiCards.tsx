'use client';

import React from 'react';
import { MonthAnalytics } from '@/lib/types';
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardsProps {
  analytics: MonthAnalytics;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function KpiCards({ analytics }: KpiCardsProps) {
  const formatCurrency = (val: number) => currencyFormatter.format(val);

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
