'use client';

import React, { useState, useEffect } from 'react';
import { ItemType } from '@/lib/types';
import { X } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  defaultType: ItemType;
  onClose: () => void;
  onAdd: (data: { type: ItemType; category: string; name: string; budgeted_amount: number; actual_amount: number }) => Promise<void>;
}

export default function AddItemModal({
  isOpen,
  defaultType,
  onClose,
  onAdd,
}: AddItemModalProps) {
  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [budgeted, setBudgeted] = useState<number>(0);
  const [actual, setActual] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        type,
        name: name.trim(),
        category: category.trim() || 'General',
        budgeted_amount: budgeted,
        actual_amount: actual,
      });
      setName('');
      setCategory('');
      setBudgeted(0);
      setActual(0);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add Budget Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-x-0 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
                  type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-semibold rounded-lg border transition ${
                  type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Bill, Consulting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
            <input
              type="text"
              placeholder="e.g. Utilities, Food, Housing"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Budgeted ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={budgeted}
                onChange={(e) => setBudgeted(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Actual ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={actual}
                onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
