import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { InsurancePolicy, InsurancePolicyInsert, InsurancePolicyUpdate } from '../types/insurance';

const QUERY_KEY = 'insurance';

export function useInsurancePolicies() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('insurance_policies').select('*').eq('user_id', userId).order('renewal_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to load insurance');
      return (data || []) as InsurancePolicy[];
    },
    enabled: Boolean(userId),
  });
}

export function useInsurancePolicy(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase.from('insurance_policies').select('*').eq('id', id).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data || null) as InsurancePolicy | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateInsurancePolicy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<InsurancePolicyInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('insurance_policies').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw new Error(error.message || 'Failed to create policy');
      return data as InsurancePolicy;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateInsurancePolicy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InsurancePolicyUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('insurance_policies').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new Error(error.message || 'Failed to update policy');
      return data as InsurancePolicy;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteInsurancePolicy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('insurance_policies').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message || 'Failed to delete policy');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
