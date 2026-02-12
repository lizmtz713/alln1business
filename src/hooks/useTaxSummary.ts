import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import type { Transaction } from '../types/transactions';
import type { TaxSummary } from '../types/tax';
import { getDefaultPeriods, computeTaxSummary } from '../services/tax';

const QUERY_KEY = 'tax-summary';

function getPeriodDates(year: number, periodLabel: string): { start: string; end: string } {
  const periods = getDefaultPeriods(year);
  const p = periods.find((x) => x.label === periodLabel && x.label !== 'Custom');
  if (p && p.start && p.end) return { start: p.start, end: p.end };
  const now = new Date();
  const y = year;
  const today = `${y}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const jan1 = `${y}-01-01`;
  return { start: jan1, end: today };
}

export function useTaxSummary(params: {
  year: number;
  period: string;
  customStart?: string;
  customEnd?: string;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { year, period, customStart, customEnd } = params;

  const { start, end } =
    period === 'Custom' && customStart && customEnd
      ? { start: customStart, end: customEnd }
      : getPeriodDates(year, period);

  return useQuery({
    queryKey: [QUERY_KEY, userId, year, start, end],
    queryFn: async (): Promise<{ summary: TaxSummary; transactions: Transaction[] }> => {
      if (!userId || !hasSupabaseConfig) {
        const emptySummary: TaxSummary = {
          period: { start, end, label: period },
          totalIncome: 0,
          totalExpenses: 0,
          totalDeductible: 0,
          byCategory: [],
          warnings: [],
        };
        return { summary: emptySummary, transactions: [] };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw new Error(error.message ?? 'Failed to load transactions');
      const transactions = (data ?? []) as Transaction[];

      const summary = computeTaxSummary({
        year,
        start,
        end,
        transactions,
      });
      return { summary, transactions };
    },
    enabled: Boolean(userId) && Boolean(start) && Boolean(end),
  });
}
