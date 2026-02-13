export type HouseholdMember = {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  age: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdMemberInsert = {
  user_id: string;
  name: string;
  relationship?: string | null;
  age?: number | null;
  notes?: string | null;
};

export type HouseholdMemberUpdate = Partial<
  Omit<HouseholdMember, 'id' | 'user_id' | 'created_at'>
>;
