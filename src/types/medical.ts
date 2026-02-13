export type MedicalRecord = {
  id: string;
  user_id: string;
  provider: string | null;
  record_date: string | null;
  record_type: string | null;
  notes: string | null;
  next_appointment: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicalRecordInsert = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'> & {
  provider?: string | null;
  record_date?: string | null;
  record_type?: string | null;
  notes?: string | null;
  next_appointment?: string | null;
};

export type MedicalRecordUpdate = Partial<Omit<MedicalRecord, 'id' | 'user_id' | 'created_at'>>;
