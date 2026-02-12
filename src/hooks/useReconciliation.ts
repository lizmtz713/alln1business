import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { Transaction } from '../types/transactions';
import type { BankStatement } from '../types/banking';

const TX_KEY = 'transactions';
const STMT_KEY = 'bank_statements';

export function useReconciliation(statementId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  const statementQuery = useQuery({
    queryKey: [STMT_KEY, userId, statementId],
    queryFn: async () => {
      if (!statementId || !userId) return null;
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('id', statementId)
        .eq('user_id', userId)
        .single();
      if (error || !data) return null;
      return data as BankStatement;
    },
    enabled: Boolean(userId && statementId),
  });

  const statement = statementQuery.data;

  const statementTransactionsQuery = useQuery({
    queryKey: [TX_KEY, userId, 'statement', statementId],
    queryFn: async () => {
      if (!statementId || !userId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('bank_statement_id', statementId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Transaction[];
    },
    enabled: Boolean(userId && statementId),
  });

  const unreconciledBookQuery = useQuery({
    queryKey: [TX_KEY, userId, 'unreconciled', statement?.start_date, statement?.end_date, statementId],
    queryFn: async () => {
      if (!userId || !statement) return [];
      const start = statement.start_date ?? statement.statement_date ?? '1900-01-01';
      const end = statement.end_date ?? statement.statement_date ?? '2100-12-31';

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_reconciled', false)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw new Error(error.message);
      const list = (data ?? []) as Transaction[];
      if (statementId) {
        return list.filter((t) => !t.bank_statement_id || t.bank_statement_id !== statementId);
      }
      return list;
    },
    enabled: Boolean(userId && statement),
  });

  const statementTransactions = statementTransactionsQuery.data ?? [];
  const unreconciledBookTransactions = unreconciledBookQuery.data ?? [];

  const startingBalance = statement?.starting_balance ?? 0;
  const statementEndingBalance = statement?.ending_balance ?? 0;
  const sumOfStatementTxns = statementTransactions.reduce(
    (sum, t) => sum + (t.amount ?? 0),
    0
  );
  const bookEndingBalance = startingBalance + sumOfStatementTxns;
  const difference = statementEndingBalance - bookEndingBalance;
  const allStatementReconciled = statementTransactions.every((t) => t.is_reconciled);
  const canComplete =
    statementTransactions.length > 0 &&
    allStatementReconciled &&
    Math.abs(difference) < 0.01;

  return {
    statement,
    statementTransactions,
    unreconciledBookTransactions,
    bookEndingBalance,
    statementEndingBalance,
    startingBalance,
    difference,
    canComplete,
    isLoading:
      statementQuery.isLoading ||
      statementTransactionsQuery.isLoading ||
      unreconciledBookQuery.isLoading,
    refetch: () => {
      statementQuery.refetch();
      statementTransactionsQuery.refetch();
      unreconciledBookQuery.refetch();
    },
  };
}

export function useMarkTransactionReconciled() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reconciled,
    }: {
      id: string;
      reconciled: boolean;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const updates = {
        is_reconciled: reconciled,
        reconciled_date: reconciled ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message ?? 'Failed to update transaction');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TX_KEY] });
    },
  });
}

function parseDate(d: string): Date {
  const s = d?.split('T')[0] ?? d ?? '';
  const [y, m, day] = s.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, day ?? 1);
}

function datesWithinDays(a: string, b: string, days: number): boolean {
  const d1 = parseDate(a).getTime();
  const d2 = parseDate(b).getTime();
  const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

export function useReconciliationSuggestions(
  statementTransactions: Transaction[],
  unreconciledBookTransactions: Transaction[]
) {
  const matches: { bookTxn: Transaction }[] = [];
  const usedBook = new Set<string>();
  const usedStmt = new Set<string>();

  for (const book of unreconciledBookTransactions) {
    if (usedBook.has(book.id)) continue;
    const bookAmt = Math.abs(book.amount ?? 0);
    for (const stmt of statementTransactions) {
      if (usedStmt.has(stmt.id)) continue;
      const stmtAmt = Math.abs(stmt.amount ?? 0);
      if (
        Math.abs(bookAmt - stmtAmt) < 0.01 &&
        datesWithinDays(book.date, stmt.date, 2)
      ) {
        matches.push({ bookTxn: book });
        usedBook.add(book.id);
        usedStmt.add(stmt.id);
        break;
      }
    }
  }
  return matches;
}

export function useCompleteReconciliation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statementId: string) => {
      if (!user?.id) throw new Error('You must be signed in');

      const { error } = await supabase
        .from('bank_statements')
        .update({
          reconciled: true,
          reconciled_date: new Date().toISOString(),
        })
        .eq('id', statementId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message ?? 'Failed to complete reconciliation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STMT_KEY] });
      queryClient.invalidateQueries({ queryKey: [TX_KEY] });
    },
  });
}
