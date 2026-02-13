import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { MedicalRecord, MedicalRecordInsert, MedicalRecordUpdate } from '../types/medical';

const QUERY_KEY = 'medical';

export function useMedicalRecords() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('medical_records').select('*').eq('user_id', userId).order('record_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to load medical records');
      return (data || []) as MedicalRecord[];
    },
    enabled: Boolean(userId),
  });
}

export function useMedicalRecord(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase.from('medical_records').select('*').eq('id', id).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data || null) as MedicalRecord | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateMedicalRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<MedicalRecordInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('medical_records').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw new Error(error.message || 'Failed to create medical record');
      return data as MedicalRecord;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateMedicalRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MedicalRecordUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('medical_records').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new Error(error.message || 'Failed to update medical record');
      return data as MedicalRecord;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteMedicalRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('medical_records').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message || 'Failed to delete medical record');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
