import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { Receipt, ReceiptInsert, ReceiptUpdate } from '../types/receipts';

const QUERY_KEY = 'receipts';

export type UseReceiptsParams = {
  category?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export function useReceipts(params?: UseReceiptsParams) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, params?.category, params?.dateFrom, params?.dateTo],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (params?.category?.trim()) {
        q = q.eq('category', params.category.trim());
      }
      if (params?.dateFrom) {
        q = q.gte('date', params.dateFrom);
      }
      if (params?.dateTo) {
        q = q.lte('date', params.dateTo);
      }
      const { data, error } = await q;
      if (error) {
        if (/relation.*does not exist|42P01/i.test(error.message ?? '')) return [];
        throw new Error(error.message ?? 'Failed to load receipts');
      }
      return (data ?? []) as Receipt[];
    },
    enabled: Boolean(userId),
  });
}

export function useReceipt(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data ?? null) as Receipt | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateReceipt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<ReceiptInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('receipts')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to save receipt');
      return data as Receipt;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateReceipt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ReceiptUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update receipt');
      return data as Receipt;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteReceipt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase.from('receipts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete receipt');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
