export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  user_id: string;
  customer_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total: number;
  amount_paid: number | null;
  balance_due: number | null;
  currency: string | null;
  notes: string | null;
  terms: string | null;
  payment_instructions: string | null;
  sent_date: string | null;
  viewed_date: string | null;
  paid_date: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceWithCustomer = Invoice & {
  customers?: {
    company_name: string | null;
    contact_name: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
};

export type InvoiceInsert = {
  user_id: string;
  customer_id?: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status?: InvoiceStatus;
  subtotal?: number;
  tax_rate?: number | null;
  tax_amount?: number | null;
  discount_amount?: number | null;
  total?: number;
  amount_paid?: number | null;
  balance_due?: number | null;
  currency?: string | null;
  notes?: string | null;
  terms?: string | null;
  payment_instructions?: string | null;
  sent_date?: string | null;
};

export type InvoiceUpdate = Partial<Omit<Invoice, 'id' | 'user_id' | 'created_at'>>;

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
};

export type InvoiceItemInsert = {
  invoice_id: string;
  description: string;
  quantity?: number;
  unit_price: number;
  amount: number;
  sort_order?: number;
};

export type InvoiceItemUpdate = Partial<Omit<InvoiceItem, 'id' | 'invoice_id'>>;
