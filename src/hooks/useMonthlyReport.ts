import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '../providers/AuthProvider';
import { getMonthlyReport, type SavedMonthlyReport } from '../services/monthlyReport';
import { generateAndSaveMonthlyReport, ensureMonthlyReportForCurrentMonth } from '../services/monthlyReportRunner';
import { formatMonthlyReportText } from '../services/monthlyReportAI';

const QUERY_KEY = 'monthlyReport';

export type MonthlyReportMonth = { year: number; month: number }; // 1-based month

function toReportMonth(ym: MonthlyReportMonth): string {
  return format(new Date(ym.year, ym.month - 1, 1), 'yyyy-MM-01');
}

export type UseMonthlyReportResult = {
  report: SavedMonthlyReport | null;
  reportText: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  /** Generate and save report for the given month (default current). */
  generateNow: (month?: MonthlyReportMonth) => Promise<boolean>;
  /** Ensure report exists for current month (run on 1st logic). Call once on app/dashboard focus. */
  ensureCurrentMonth: () => Promise<void>;
};

export function useMonthlyReport(month?: MonthlyReportMonth): UseMonthlyReportResult {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const now = new Date();
  const target = month ?? { year: now.getFullYear(), month: now.getMonth() + 1 };
  const reportMonth = toReportMonth(target);
  const monthName = format(new Date(target.year, target.month - 1, 1), 'MMMM');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, userId, reportMonth],
    queryFn: async (): Promise<SavedMonthlyReport | null> => {
      if (!userId) return null;
      return getMonthlyReport(userId, reportMonth);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  const report = query.data ?? null;
  const reportText = report
    ? formatMonthlyReportText(monthName, target.year, {
        summary: report.summary_text,
        highlights: (report.highlights as string[]) ?? [],
        suggestions: (report.suggestions as string[]) ?? [],
      })
    : '';

  const generateNow = async (forMonth?: MonthlyReportMonth): Promise<boolean> => {
    if (!userId) return false;
    const m = forMonth ?? target;
    const rm = toReportMonth(m);
    const { saved } = await generateAndSaveMonthlyReport(userId, rm, { sendPush: false });
    if (saved) await queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId, rm] });
    return saved;
  };

  const ensureCurrentMonth = async () => {
    if (!userId) return;
    await ensureMonthlyReportForCurrentMonth(userId);
    const current = toReportMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId, current] });
  };

  return {
    report,
    reportText,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    generateNow,
    ensureCurrentMonth,
  };
}
