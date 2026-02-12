export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type RecurrenceInterval = 'monthly' | 'quarterly' | 'yearly' | null;

export type Bill = {
  id: string;
  user_id: string;
  vendor_id: string | null;
  bill_name: string;
  provider_name: string | null;
  account_number: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_website: string | null;
  payment_url: string | null;
  bill_date: string | null;
  due_date: string;
  amount: number;
  status: BillStatus;
  is_recurring: boolean;
  recurrence_interval: string | null;
  auto_pay: boolean;
  category: string | null;
  payment_method: string | null;
  confirmation_number: string | null;
  paid_date: string | null;
  paid_amount: number | null;
  notes: string | null;
  attachment_url: string | null;
  reminder_days: number;
  created_at: string;
  updated_at: string;
};

export type BillWithVendor = Bill & {
  vendors?: {
    company_name: string | null;
    contact_name: string | null;
  } | null;
};

export type BillInsert = {
  user_id: string;
  vendor_id?: string | null;
  bill_name: string;
  provider_name?: string | null;
  account_number?: string | null;
  provider_phone?: string | null;
  provider_email?: string | null;
  provider_website?: string | null;
  payment_url?: string | null;
  bill_date?: string | null;
  due_date: string;
  amount: number;
  status?: BillStatus;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  auto_pay?: boolean;
  category?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  attachment_url?: string | null;
  reminder_days?: number;
};

export type BillUpdate = Partial<Omit<Bill, 'id' | 'user_id' | 'created_at'>>;
