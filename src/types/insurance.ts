export type InsurancePolicy = {
  id: string;
  user_id: string;
  provider: string;
  policy_number: string | null;
  policy_type: string | null;
  premium_amount: number | null;
  premium_frequency: string | null;
  renewal_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InsurancePolicyInsert = Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'> & {
  policy_number?: string | null;
  policy_type?: string | null;
  premium_amount?: number | null;
  premium_frequency?: string | null;
  renewal_date?: string | null;
  notes?: string | null;
};

export type InsurancePolicyUpdate = Partial<Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>>;
