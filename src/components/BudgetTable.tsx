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
