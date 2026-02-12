export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  subcategory: string | null;
  payment_method: string | null;
  reference_number: string | null;
  is_reconciled: boolean;
  reconciled_date: string | null;
  receipt_url: string | null;
  invoice_id: string | null;
  bill_id: string | null;
  ai_categorized: boolean;
  ai_confidence: number | null;
  tax_deductible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionFilters = {
  dateRange?: { start: string; end: string };
  type?: 'income' | 'expense';
  category?: string;
  reconciled?: boolean;
};

export type TransactionInsert = {
  user_id: string;
  date: string;
  vendor?: string | null;
  description?: string | null;
  amount: number;
  type: 'income' | 'expense';
  category?: string | null;
  subcategory?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  is_reconciled?: boolean;
  tax_deductible?: boolean;
  notes?: string | null;
  receipt_url?: string | null;
};

export type TransactionUpdate = Partial<
  Omit<Transaction, 'id' | 'user_id' | 'created_at'>
>;
