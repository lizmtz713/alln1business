export type HomeServiceType = 'plumber' | 'electrician' | 'hvac' | 'lawn' | 'other';

export type HomeServiceContact = {
  id: string;
  user_id: string;
  service_type: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  last_service_date: string | null;
  created_at: string;
  updated_at: string;
};

export type HomeServiceContactInsert = Omit<HomeServiceContact, 'id' | 'created_at' | 'updated_at'> & {
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  last_service_date?: string | null;
};

export type HomeServiceContactUpdate = Partial<Omit<HomeServiceContact, 'id' | 'user_id' | 'created_at'>>;
