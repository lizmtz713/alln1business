export type Pet = {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  breed: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vaccination_dates: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PetInsert = Omit<Pet, 'id' | 'created_at' | 'updated_at'> & {
  type?: string | null;
  breed?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  vaccination_dates?: string | null;
  notes?: string | null;
};

export type PetUpdate = Partial<Omit<Pet, 'id' | 'user_id' | 'created_at'>>;
