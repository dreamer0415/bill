
import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { X, Save } from 'lucide-react';

interface InvoiceEditorProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoice, onClose, onSave }) => {
  const [formData, setFormData] = useState<Invoice | null>(null);

  useEffect(() => {
    if (invoice) {
      setFormData({ ...invoice });
    }
  }, [invoice]);

  if (!invoice || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? {
      ...prev,
      [name]: name === 'totalAmount' ? parseFloat(value) || 0 : value
    } : null);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    if (!formData) return;
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
          <h2 className="text-xl font-bold text-indigo-900">編輯發票資訊</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">發票號碼</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商家名稱</label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">總金額</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">消費明細</h3>
            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    placeholder="品項"
                    className="flex-1 px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="數量"
                    className="w-16 px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="金額"
                    className="w-20 px-2 py-1 border rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
