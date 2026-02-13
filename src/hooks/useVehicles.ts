import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { Vehicle, VehicleInsert, VehicleUpdate } from '../types/vehicles';

const QUERY_KEY = 'vehicles';

export function useVehicles() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to load vehicles');
      return (data || []) as Vehicle[];
    },
    enabled: Boolean(userId),
  });
}

export function useVehicle(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data || null) as Vehicle | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<VehicleInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('vehicles').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw new Error(error.message || 'Failed to create vehicle');
      return data as Vehicle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: VehicleUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase.from('vehicles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw new Error(error.message || 'Failed to update vehicle');
      return data as Vehicle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message || 'Failed to delete vehicle');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
