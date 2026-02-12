import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { TransactionInsert } from '../types/transactions';

const QUERY_KEY = 'transactions';

type ImportRow = {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  vendor?: string;
};

export function useUploadStatement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      if (!user?.id) throw new Error('You must be signed in to import transactions');

      if (rows.length === 0) return { count: 0 };

      const insertRows: TransactionInsert[] = rows.map((r) => ({
        user_id: user.id,
        date: r.date,
        amount: r.type === 'expense' ? -Math.abs(r.amount) : Math.abs(r.amount),
        type: r.type,
        vendor: r.vendor ?? r.description?.slice(0, 100) ?? null,
        description: r.description || null,
        category: r.category || null,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertRows)
        .select('id');

      if (error) throw new Error(error.message ?? 'Failed to import transactions');

      return { count: data?.length ?? rows.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
