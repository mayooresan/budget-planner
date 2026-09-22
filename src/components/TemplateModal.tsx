'use client';

import React, { useState, useEffect } from 'react';
import { TemplateItem, ItemType } from '@/lib/types';
import { getTemplateItems, addTemplateItem, updateTemplateItem, deleteTemplateItem } from '@/lib/actions';
import { X, Plus, Trash2, Check, Edit2 } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesChanged?: () => void;
}

export default function TemplateModal({ isOpen, onClose, onTemplatesChanged }: TemplateModalProps) {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<TemplateItem>>({});

  // New item form state
  const [newType, setNewType] = useState<ItemType>('expense');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);

  const loadTemplates = async () => {
    const list = await getTemplateItems();
    setItems(list);
  };

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addTemplateItem({
      type: newType,
      category: newCategory.trim() || 'General',
      name: newName.trim(),
      default_budgeted_amount: newAmount,
      sort_order: items.length + 1,
    });
    setNewName('');
    setNewCategory('');
    setNewAmount(0);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  const handleSaveEdit = async (id: number) => {
    if (editForm.name !== undefined && !editForm.name.trim()) return;
    await updateTemplateItem(id, editForm);
    setEditingId(null);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  const handleDelete = async (id: number) => {
    await deleteTemplateItem(id);
    await loadTemplates();
    onTemplatesChanged?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Default Monthly Template</h3>
            <p className="text-xs text-gray-500">Items configured here automatically populate any new month you select</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new template row */}
        <form onSubmit={handleAddNew} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as ItemType)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="text"
            required
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
          <input
            type="text"
            placeholder="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
          <input
            type="number"
            step="any"
            placeholder="Default $"
            value={newAmount || ''}
            onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-right"
          />
          <button
            type="submit"
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* List of template items */}
        <div className="flex-1 overflow-y-auto mt-4 border border-gray-100 rounded-xl">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Default Amount</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded font-semibold ${item.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                        />
                      ) : (
                        item.category
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900 text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={editForm.default_budgeted_amount ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, default_budgeted_amount: parseFloat(e.target.value) || 0 })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs w-20 text-right"
                        />
                      ) : (
                        `$${item.default_budgeted_amount.toLocaleString()}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditForm(item);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-4 mt-auto border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
