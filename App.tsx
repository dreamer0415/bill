
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Download, Copy, Trash2, Edit2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Invoice, ExportFormat } from './types';
import { extractInvoiceData } from './services/geminiService';
import InvoiceEditor from './components/InvoiceEditor';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newInvoices: Invoice[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      const imageUrl = URL.createObjectURL(file);

      // Create initial placeholder
      const placeholder: Invoice = {
        id,
        date: '辨識中...',
        number: '辨識中...',
        vendor: '辨識中...',
        totalAmount: 0,
        items: [],
        status: 'processing',
        imageUrl
      };
      
      setInvoices(prev => [placeholder, ...prev]);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        
        const extracted = await extractInvoiceData(base64);
        
        setInvoices(prev => prev.map(inv => 
          inv.id === id ? {
            ...inv,
            ...extracted,
            status: 'completed' as const
          } : inv
        ));
      } catch (error) {
        console.error("Extraction failed", error);
        setInvoices(prev => prev.map(inv => 
          inv.id === id ? { ...inv, status: 'error' as const } : inv
        ));
      }
    }
    setIsUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const copyToClipboard = () => {
    const header = "日期\t發票號碼\t商家\t總金額\n";
    const body = invoices
      .filter(i => i.status === 'completed')
      .map(i => `${i.date}\t${i.number}\t${i.vendor}\t${i.totalAmount}`)
      .join('\n');
    
    navigator.clipboard.writeText(header + body);
    alert('已複製到剪貼簿！');
  };

  const exportData = (format: ExportFormat) => {
    const data = invoices.filter(i => i.status === 'completed');
    if (data.length === 0) return;

    let content = '';
    let mimeType = 'text/csv';
    let fileName = `invoices_${new Date().getTime()}.csv`;

    if (format === ExportFormat.CSV || format === ExportFormat.EXCEL) {
      // Both can open CSV easily
      const headers = ["日期", "發票號碼", "商家", "總金額", "明細"];
      const rows = data.map(i => [
        i.date,
        i.number,
        i.vendor,
        i.totalAmount,
        i.items.map(item => `${item.name}(${item.quantity})`).join('; ')
      ]);
      content = [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    const blob = new Blob(["\uFEFF" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const updateInvoice = (updated: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    setEditingInvoice(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-black text-indigo-600 text-center tracking-tight">
            發票小助手
          </h1>
          <p className="text-center text-gray-500 mt-2">智慧辨識、自動整理，您的理財好隊友</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Upload Zone */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-indigo-200 rounded-3xl p-12 text-center bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
        >
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center">
            <div className="bg-indigo-100 p-6 rounded-full group-hover:scale-110 transition-transform mb-4">
              <Upload className="text-indigo-600" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">點擊或拖放發票照片</h3>
            <p className="text-gray-500 mt-2">支援單張或多張電子發票上傳 (JPG, PNG)</p>
          </div>
        </div>

        {/* Action Buttons */}
        {invoices.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={20} />
              <span className="font-medium">共 {invoices.length} 張發票</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-colors"
              >
                <Copy size={18} />
                複製表格
              </button>
              <button 
                onClick={() => exportData(ExportFormat.CSV)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-md transition-all active:scale-95"
              >
                <Download size={18} />
                匯出 CSV/Excel
              </button>
            </div>
          </div>
        )}

        {/* Invoice List / Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-sm font-semibold">
                  <th className="px-6 py-4">預覽</th>
                  <th className="px-6 py-4">日期</th>
                  <th className="px-6 py-4">發票號碼</th>
                  <th className="px-6 py-4">商家名稱</th>
                  <th className="px-6 py-4 text-right">金額</th>
                  <th className="px-6 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                      尚未上傳任何發票
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className={`hover:bg-indigo-50/30 transition-colors group ${invoice.status === 'processing' ? 'animate-pulse' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                          {invoice.imageUrl ? (
                            <img src={invoice.imageUrl} alt="Invoice" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-300" size={24} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {invoice.status === 'processing' ? (
                          <div className="flex items-center gap-2 text-indigo-400">
                            <Loader2 className="animate-spin" size={16} />
                            辨識中...
                          </div>
                        ) : invoice.date}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{invoice.number}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{invoice.vendor}</td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-indigo-600">
                        ${invoice.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            disabled={invoice.status === 'processing'}
                            onClick={() => setEditingInvoice(invoice)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                            title="編輯"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteInvoice(invoice.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {editingInvoice && (
        <InvoiceEditor 
          invoice={editingInvoice} 
          onClose={() => setEditingInvoice(null)} 
          onSave={updateInvoice} 
        />
      )}

      {/* Footer / Mobile Nav space */}
      <footer className="mt-12 text-center text-gray-400 text-sm py-8">
        © 2024 發票小助手 - 智慧 AI 驅動
      </footer>
    </div>
  );
};

export default App;
