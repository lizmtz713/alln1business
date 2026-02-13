export type Receipt = {
  id: string;
  user_id: string;
  image_url: string;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  ocr_text: string | null;
  transaction_id: string | null;
  created_at: string;
};

export type ReceiptInsert = Omit<Receipt, 'id' | 'created_at'>;
export type ReceiptUpdate = Partial<Omit<Receipt, 'id' | 'user_id' | 'created_at'>>;
