export type InventoryWalkthrough = {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  user_id: string;
  walkthrough_id: string | null;
  room: string;
  item_name: string;
  brand: string | null;
  purchase_year: number | null;
  value: number;
  category: string | null;
  photo_url: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type InventoryItemInsert = {
  user_id: string;
  walkthrough_id?: string | null;
  room: string;
  item_name: string;
  brand?: string | null;
  purchase_year?: number | null;
  value?: number;
  category?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  sort_order?: number;
};

export type InventoryItemUpdate = Partial<
  Omit<InventoryItemInsert, 'user_id'>
>;
