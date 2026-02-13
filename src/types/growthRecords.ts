export type GrowthRecord = {
  id: string;
  user_id: string;
  name: string;
  record_date: string;
  shoe_size: string | null;
  height_inches: number | null;
  shirt_size: string | null;
  notes: string | null;
  created_at: string;
};

export type GrowthRecordInsert = Omit<GrowthRecord, 'id' | 'created_at'> & {
  shoe_size?: string | null;
  height_inches?: number | null;
  shirt_size?: string | null;
  notes?: string | null;
};
