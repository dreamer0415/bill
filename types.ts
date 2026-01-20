
export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  date: string;
  number: string;
  vendor: string;
  totalAmount: number;
  items: InvoiceItem[];
  status: 'processing' | 'completed' | 'error';
  imageUrl?: string;
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'Excel'
}
