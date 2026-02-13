import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { Appointment, AppointmentInsert, AppointmentUpdate } from '../types/appointments';

const QUERY_KEY = 'appointments';

export function useAppointments(params?: { fromDate?: string; toDate?: string }) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, params?.fromDate, params?.toDate],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true, nullsFirst: false });
      if (params?.fromDate) q = q.gte('appointment_date', params.fromDate);
      if (params?.toDate) q = q.lte('appointment_date', params.toDate);
      const { data, error } = await q;
      if (error) throw new Error(error.message ?? 'Failed to load appointments');
      return (data ?? []) as Appointment[];
    },
    enabled: Boolean(userId),
  });
}

export function useAppointment(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data ?? null) as Appointment | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateAppointment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AppointmentInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to create appointment');
      return data as Appointment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateAppointment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AppointmentUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update appointment');
      return data as Appointment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteAppointment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('appointments').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete appointment');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
