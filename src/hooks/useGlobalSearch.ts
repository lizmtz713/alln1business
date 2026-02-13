import { useQueries } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { BillWithVendor } from '../types/bills';
import type { DocumentWithRelations } from '../types/documents';
import type { Vehicle } from '../types/vehicles';
import type { Pet } from '../types/pets';
import type { InsurancePolicy } from '../types/insurance';
import type { MedicalRecord } from '../types/medical';
import type { HomeServiceContact } from '../types/homeServices';
import type { Appointment } from '../types/appointments';

export type GlobalSearchResult = {
  bills: BillWithVendor[];
  documents: DocumentWithRelations[];
  vehicles: Vehicle[];
  pets: Pet[];
  insurancePolicies: InsurancePolicy[];
  medicalRecords: MedicalRecord[];
  homeServiceContacts: HomeServiceContact[];
  appointments: Appointment[];
  isLoading: boolean;
  isError: boolean;
};

function searchTerm(list: { [key: string]: unknown }[], term: string, fields: string[]) {
  return list.filter((row) =>
    fields.some((f) => {
      const v = row[f];
      if (v == null) return false;
      return String(v).toLowerCase().includes(term);
    })
  );
}

function useGlobalSearchQueries(query: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const enabled = Boolean(userId && query.trim().length >= 2);
  const term = query.trim().toLowerCase();
  return useQueries({
    queries: [
      {
        queryKey: ['global-search', 'bills', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('bills').select('*').eq('user_id', userId).neq('status', 'cancelled');
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['bill_name', 'provider_name']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'documents', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('documents').select('*').eq('user_id', userId).eq('is_template', false);
          if (error) throw new Error(error.message);
          const list = (data ?? []) as DocumentWithRelations[];
          return list.filter(
            (d) =>
              d.name?.toLowerCase().includes(term) ||
              (d.description ?? '').toLowerCase().includes(term) ||
              (d.tags ?? []).some((t) => t.toLowerCase().includes(term))
          );
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'vehicles', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('vehicles').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['make', 'model', 'vin', 'notes']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'pets', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['name', 'type', 'breed', 'vet_name', 'notes']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'insurance', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('insurance_policies').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['provider', 'policy_number', 'policy_type', 'notes']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'medical', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('medical_records').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['provider', 'record_type', 'notes']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'home-services', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('home_service_contacts').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['name', 'service_type', 'notes']);
        },
        enabled,
      },
      {
        queryKey: ['global-search', 'appointments', userId, query],
        queryFn: async () => {
          if (!userId) return [];
          const { data, error } = await supabase.from('appointments').select('*').eq('user_id', userId);
          if (error) throw new Error(error.message);
          return searchTerm((data ?? []) as { [key: string]: unknown }[], term, ['title', 'location', 'notes']);
        },
        enabled,
      },
    ],
  });
}

export function useGlobalSearch(query: string): GlobalSearchResult {
  const results = useGlobalSearchQueries(query);
  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  return {
    bills: (results[0].data ?? []) as BillWithVendor[],
    documents: (results[1].data ?? []) as DocumentWithRelations[],
    vehicles: (results[2].data ?? []) as Vehicle[],
    pets: (results[3].data ?? []) as Pet[],
    insurancePolicies: (results[4].data ?? []) as InsurancePolicy[],
    medicalRecords: (results[5].data ?? []) as MedicalRecord[],
    homeServiceContacts: (results[6].data ?? []) as HomeServiceContact[],
    appointments: (results[7].data ?? []) as Appointment[],
    isLoading,
    isError,
  };
}
