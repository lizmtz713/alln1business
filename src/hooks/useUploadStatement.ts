import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type { TransactionInsert } from '../types/transactions';

const QUERY_KEY = 'transactions';
const STMT_KEY = 'bank_statements';

export type ImportRow = {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  vendor?: string;
};

export type UploadStatementInput = {
  rows: ImportRow[];
  filename?: string;
  bankAccountId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startingBalance?: number | null;
  endingBalance?: number | null;
  totalDeposits?: number | null;
  totalWithdrawals?: number | null;
};

export function useUploadStatement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadStatementInput) => {
      if (!user?.id) throw new Error('You must be signed in to import transactions');

      const {
        rows,
        filename,
        bankAccountId,
        startDate,
        endDate,
        startingBalance,
        endingBalance,
        totalDeposits,
        totalWithdrawals,
      } = input;

      if (rows.length === 0) return { count: 0, statementId: null };

      const { data: stmtData, error: stmtError } = await supabase
        .from('bank_statements')
        .insert({
          user_id: user.id,
          bank_account_id: bankAccountId ?? null,
          filename: filename ?? null,
          start_date: startDate ?? null,
          end_date: endDate ?? null,
          starting_balance: startingBalance ?? null,
          ending_balance: endingBalance ?? null,
          total_deposits: totalDeposits ?? null,
          total_withdrawals: totalWithdrawals ?? null,
          transaction_count: rows.length,
        })
        .select('id')
        .single();

      if (stmtError) throw new Error(stmtError.message ?? 'Failed to create statement');

      const statementId = stmtData?.id;

      const insertRows: TransactionInsert[] = rows.map((r) => ({
        user_id: user.id,
        date: r.date,
        amount: r.type === 'expense' ? -Math.abs(r.amount) : Math.abs(r.amount),
        type: r.type,
        vendor: r.vendor ?? r.description?.slice(0, 100) ?? null,
        description: r.description || null,
        category: r.category || null,
        bank_statement_id: statementId ?? null,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertRows)
        .select('id');

      if (error) throw new Error(error.message ?? 'Failed to import transactions');

      return { count: data?.length ?? rows.length, statementId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STMT_KEY] });
    },
  });
}
