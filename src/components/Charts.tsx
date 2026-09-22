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
    .filter((cat) => cat.amount > 0)
    .map((cat) => ({
      name: cat.category,
      value: cat.amount,
      percentage: cat.percentage,
    }));

  const barData = analytics.expenseCategories.map((cat) => ({
    name: cat.category,
    Amount: cat.amount,
  }));

  const formatCurrency = (val: number) => `$${Number(val).toLocaleString()}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut Chart: Expense Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
        <h2 className="text-base font-bold text-gray-900 mb-1">Expense Breakdown</h2>
        <p className="text-xs text-gray-500 mb-4">Planned distribution by category</p>

        {expenseData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[260px] text-sm text-gray-400">
            No planned expenses for this month yet
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
                  formatter={(val: number) => [formatCurrency(val), 'Planned']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bar Chart: Category Budget Allocations */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
        <h2 className="text-base font-bold text-gray-900 mb-1">Category Allocations</h2>
        <p className="text-xs text-gray-500 mb-4">Planned amounts per expense category</p>

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
                  formatter={(val: number) => [formatCurrency(val), 'Planned']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="Amount" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
