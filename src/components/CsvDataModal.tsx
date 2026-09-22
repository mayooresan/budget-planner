'use client';

import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface CsvDataModalProps {
  isOpen: boolean;
  currentMonth: string;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function CsvDataModal({
  isOpen,
  currentMonth,
  onClose,
  onImportSuccess,
}: CsvDataModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = (all: boolean) => {
    const url = all ? '/api/export?month=all' : `/api/export?month=${currentMonth}`;
    window.open(url, '_blank');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV');
      }

      setMessage({ type: 'success', text: `Successfully imported ${data.importedCount} items!` });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onImportSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Import error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Backup & Restore (CSV)</h3>
            <p className="text-xs text-gray-500">Export or import your SQLite budget data</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Export Data</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExport(false)}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export {currentMonth}</span>
            </button>
            <button
              onClick={() => handleExport(true)}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export All Months</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Import Data</h4>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Importing...' : 'Upload & Import CSV'}</span>
            </button>
          </form>

          {message && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
