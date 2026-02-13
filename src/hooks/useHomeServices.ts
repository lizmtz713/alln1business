import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { HomeServiceContact, HomeServiceContactInsert, HomeServiceContactUpdate } from '../types/homeServices';

const QUERY_KEY = 'homeServices';

export function useHomeServiceContacts(params?: { serviceType?: string }) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, params?.serviceType],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase.from('home_service_contacts').select('*').eq('user_id', userId).order('last_service_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      if (params?.serviceType) q = q.eq('service_type', params.serviceType);
      const { data, error } = await q;
      if (error) throw new Error(error.message || 'Failed to load home service contacts');
      return (data || []) as HomeServiceContact[];
    },
    enabled: Boolean(userId),
  });
}

export function useHomeServiceContact(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase.from('home_service_contacts').select('*').eq('id', id).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data || null) as HomeServiceContact | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateHomeServiceContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<HomeServiceContactInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('home_service_contacts').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw new Error(error.message || 'Failed to create contact');
      return data as HomeServiceContact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateHomeServiceContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: HomeServiceContactUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('home_service_contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new Error(error.message || 'Failed to update contact');
      return data as HomeServiceContact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteHomeServiceContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('home_service_contacts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message || 'Failed to delete contact');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
