export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurring_rule: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'> & {
  appointment_time?: string | null;
  location?: string | null;
  notes?: string | null;
  is_recurring?: boolean;
  recurring_rule?: string | null;
};

export type AppointmentUpdate = Partial<Omit<Appointment, 'id' | 'user_id' | 'created_at'>>;
