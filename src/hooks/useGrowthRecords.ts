import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { GrowthRecord, GrowthRecordInsert } from '../types/growthRecords';

const QUERY_KEY = 'growthRecords';

export function useGrowthRecords() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('growth_records')
        .select('*')
        .eq('user_id', userId)
        .order('record_date', { ascending: false });
      if (error) throw new Error(error.message ?? 'Failed to load growth records');
      return (data ?? []) as GrowthRecord[];
    },
    enabled: Boolean(userId),
  });
}

export function useAddGrowthRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<GrowthRecordInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('growth_records')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to add record');
      return data as GrowthRecord;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
