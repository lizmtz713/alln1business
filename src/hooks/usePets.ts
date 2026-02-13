import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { Pet, PetInsert, PetUpdate } from '../types/pets';

const QUERY_KEY = 'pets';

export function usePets() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to load pets');
      return (data || []) as Pet[];
    },
    enabled: Boolean(userId),
  });
}

export function usePet(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase.from('pets').select('*').eq('id', id).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data || null) as Pet | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreatePet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<PetInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('pets').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw new Error(error.message || 'Failed to create pet');
      return data as Pet;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PetUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('pets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new Error(error.message || 'Failed to update pet');
      return data as Pet;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeletePet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('pets').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message || 'Failed to delete pet');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
