import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { BankStatement, BankStatementInsert } from '../types/banking';

const QUERY_KEY = 'bank_statements';

export function useBankStatements(bankAccountId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, bankAccountId],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('bank_statements')
        .select('*')
        .eq('user_id', userId)
        .order('statement_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (bankAccountId) q = q.eq('bank_account_id', bankAccountId);
      const { data, error } = await q;
      if (error) throw new Error(error.message ?? 'Failed to load statements');
      return (data ?? []) as BankStatement[];
    },
    enabled: Boolean(userId),
  });
}

export function useBankStatement(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data ?? null) as BankStatement | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateBankStatement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<BankStatementInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('bank_statements')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to create statement');
      return data as BankStatement;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateBankStatement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: { id: string; updates: { reconciled?: boolean; reconciled_date?: string | null } }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('bank_statements')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update statement');
      return data as BankStatement;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
