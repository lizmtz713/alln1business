import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../components/ui';
import { supabase } from '../services/supabase';
import { normalizeError } from '../lib/errors';
import { hapticSuccess } from '../lib/haptics';
import type {
  Transaction,
  TransactionFilters,
  TransactionInsert,
  TransactionUpdate,
} from '../types/transactions';

const QUERY_KEY = 'transactions';

function formatDate(d: string): string {
  return d.split('T')[0];
}

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, filters],
    queryFn: async () => {
      if (!userId) return [];

      let q = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.type) {
        q = q.eq('type', filters.type);
      }
      if (filters?.category) {
        q = q.eq('category', filters.category);
      }
      if (filters?.reconciled !== undefined) {
        q = q.eq('is_reconciled', filters.reconciled);
      }
      if (filters?.dateRange) {
        q = q.gte('date', filters.dateRange.start);
        q = q.lte('date', filters.dateRange.end);
      }

      const { data, error } = await q;

      if (error) {
        if (/relation.*does not exist|42P01/i.test(error.message ?? '')) return [];
        throw new Error(error.message ?? 'Failed to load transactions');
      }
      return (data ?? []) as Transaction[];
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useTransaction(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message ?? 'Failed to load transaction');
      }
      return data as Transaction;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (input: Omit<TransactionInsert, 'user_id'>) => {
      if (!user?.id) {
        throw new Error('You must be signed in to add transactions');
      }

      const row: TransactionInsert = {
        ...input,
        user_id: user.id,
        date: formatDate(input.date),
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(row)
        .select()
        .single();

      if (error) {
        throw new Error(error.message ?? 'Failed to create transaction');
      }
      return data as Transaction;
    },
    onMutate: async (input) => {
      if (!user?.id) return undefined;
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const tempId = `opt-${Date.now()}`;
      const optimistic: Transaction = {
        id: tempId,
        user_id: user.id,
        date: formatDate(input.date),
        vendor: input.vendor ?? null,
        description: input.description ?? null,
        amount: input.amount,
        type: input.type,
        category: input.category ?? null,
        subcategory: input.subcategory ?? null,
        payment_method: input.payment_method ?? null,
        reference_number: input.reference_number ?? null,
        is_reconciled: false,
        reconciled_date: null,
        receipt_url: input.receipt_url ?? null,
        bank_statement_id: input.bank_statement_id ?? null,
        invoice_id: null,
        bill_id: null,
        ai_categorized: false,
        ai_confidence: null,
        tax_deductible: input.tax_deductible ?? false,
        notes: input.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: [QUERY_KEY] },
        (old) => (Array.isArray(old) ? [optimistic, ...old] : old)
      );
      return { tempId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.tempId) {
        queryClient.setQueriesData<Transaction[]>(
          { queryKey: [QUERY_KEY] },
          (old) =>
            Array.isArray(old)
              ? old.map((t) => (t.id === context.tempId ? data : t))
              : old
        );
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.show('Saved', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.show(normalizeError(e), 'error');
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TransactionUpdate;
    }) => {
      if (!user?.id) {
        throw new Error('You must be signed in to update transactions');
      }

      const payload = { ...updates, updated_at: new Date().toISOString() };
      if (updates.date) {
        payload.date = formatDate(updates.date);
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message ?? 'Failed to update transaction');
      }
      return data as Transaction;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previous = queryClient.getQueriesData<Transaction[]>({ queryKey: [QUERY_KEY] });
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: [QUERY_KEY] },
        (old) => {
          if (!Array.isArray(old)) return old;
          const updatedAt = new Date().toISOString();
          return old.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...updates,
                  ...(updates.date && { date: formatDate(updates.date) }),
                  updated_at: updatedAt,
                }
              : t
          );
        }
      );
      return { previous };
    },
    onError: (_e, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.show(normalizeError(_e), 'error');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, data.user_id, data.id],
      });
      toast.show('Saved', 'success');
      hapticSuccess();
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('You must be signed in to delete transactions');
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message ?? 'Failed to delete transaction');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previous = queryClient.getQueriesData<Transaction[]>({ queryKey: [QUERY_KEY] });
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: [QUERY_KEY] },
        (old) => (Array.isArray(old) ? old.filter((t) => t.id !== id) : old)
      );
      return { previous };
    },
    onError: (e, _id, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.show(normalizeError(e), 'error');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.show('Deleted', 'success');
      hapticSuccess();
    },
  });
}
