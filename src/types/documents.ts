export type DocType =
  | 'contract'
  | 'nda'
  | 'agreement'
  | 'w9'
  | 'tax_form'
  | 'license'
  | 'certificate'
  | 'receipt'
  | 'invoice'
  | 'other';

export type DocCategory = 'customer' | 'vendor' | 'employee' | 'tax' | 'legal' | 'other';

export type Document = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  doc_type: DocType;
  category: DocCategory | null;
  related_customer_id: string | null;
  related_vendor_id: string | null;
  file_url: string;
  pdf_url: string | null;
  txt_file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  expiration_date: string | null;
  is_template: boolean;
  is_signed: boolean;
  signed_date: string | null;
  signed_by: string | null;
  tags: string[] | null;
  ai_summary: string | null;
  content_text: string | null;
  template_id: string | null;
  generated_by_ai: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentWithRelations = Document & {
  customers?: { company_name: string | null; contact_name: string | null } | null;
  vendors?: { company_name: string; contact_name: string | null } | null;
};

export type DocumentInsert = {
  user_id: string;
  name: string;
  description?: string | null;
  doc_type: DocType;
  category?: DocCategory | null;
  related_customer_id?: string | null;
  related_vendor_id?: string | null;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  expiration_date?: string | null;
  is_template?: boolean;
  is_signed?: boolean;
  signed_date?: string | null;
  signed_by?: string | null;
  tags?: string[] | null;
  ai_summary?: string | null;
  content_text?: string | null;
  template_id?: string | null;
  generated_by_ai?: boolean;
};

export type DocumentUpdate = Partial<
  Omit<Document, 'id' | 'user_id' | 'created_at'>
>;
