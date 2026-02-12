export type PaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60';
export type VendorType = 'supplier' | 'contractor' | 'service' | 'other';
export type PaymentMethod = 'check' | 'ach' | 'card' | 'other';

export type Customer = {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tax_exempt: boolean;
  tax_exempt_number: string | null;
  payment_terms: PaymentTerms | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = {
  user_id: string;
  company_name?: string | null;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  tax_exempt?: boolean;
  tax_exempt_number?: string | null;
  payment_terms?: PaymentTerms | null;
  notes?: string | null;
  is_active?: boolean;
};

export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'user_id' | 'created_at'>>;

export type Vendor = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  ein: string | null;
  w9_requested: boolean;
  w9_received: boolean;
  w9_received_date: string | null;
  w9_file_url: string | null;
  vendor_type: VendorType | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VendorInsert = {
  user_id: string;
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ein?: string | null;
  w9_requested?: boolean;
  w9_received?: boolean;
  w9_received_date?: string | null;
  w9_file_url?: string | null;
  vendor_type?: VendorType | null;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
  is_active?: boolean;
};

export type VendorUpdate = Partial<Omit<Vendor, 'id' | 'user_id' | 'created_at'>>;
