import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { BankAccount, BankAccountInsert, BankAccountUpdate } from '../types/banking';

const QUERY_KEY = 'bank_accounts';

export function useBankAccounts() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message ?? 'Failed to load bank accounts');
      return (data ?? []) as BankAccount[];
    },
    enabled: Boolean(userId),
  });
}

export function useCreateBankAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<BankAccountInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();

      if (error) throw new Error(error.message ?? 'Failed to create bank account');
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateBankAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: BankAccountUpdate;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw new Error(error.message ?? 'Failed to update bank account');
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
