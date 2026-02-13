export type Vehicle = {
  id: string;
  user_id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  insurance_provider: string | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  notes: string | null;
  current_mileage?: number | null;
  last_oil_change_mileage?: number | null;
  last_oil_change_date?: string | null;
  oil_change_interval_miles?: number | null;
  created_at: string;
  updated_at: string;
};

export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> & {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  insurance_provider?: string | null;
  insurance_expiry?: string | null;
  registration_expiry?: string | null;
  notes?: string | null;
};

export type VehicleUpdate = Partial<Omit<Vehicle, 'id' | 'user_id' | 'created_at'>>;
