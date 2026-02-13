/**
 * Monthly report generator: cost analysis, trends, upcoming highlights.
 * Runs on 1st of month or on-demand. Feeds AI summary + personalized suggestions.
 */
import { supabase, hasSupabaseConfig } from './supabase';
import { format, subMonths, addDays, parseISO } from 'date-fns';
import { fetchHouseholdReportData, type HouseholdReportData } from './householdReport';

export type CostGroup = {
  label: string;
  total: number;
  bills: { bill_name: string; provider_name: string | null; amount: number }[];
};

export type TrendPoint = {
  month: string;
  total: number;
  count: number;
};

export type UpcomingHighlight = {
  type: 'bill' | 'appointment' | 'birthday' | 'registration' | 'vaccination';
  label: string;
  date?: string;
  detail?: string;
};

export type MonthlyReportData = HouseholdReportData & {
  /** Bills grouped for suggestions (e.g. streaming, utilities) */
  costGroups: CostGroup[];
  /** Last 3 months bill totals for trend */
  trends: TrendPoint[];
  /** Important upcoming items for highlights section */
  upcomingHighlights: UpcomingHighlight[];
};

const STREAMING_KEYWORDS = ['netflix', 'hulu', 'disney', 'hbo', 'peacock', 'paramount', 'apple tv', 'youtube premium', 'spotify', 'amazon prime', 'max'];
const UTILITY_KEYWORDS = ['electric', 'gas', 'water', 'internet', 'waste', 'utility'];

function groupBillsByCategory(
  bills: Array<{ bill_name: string; provider_name: string | null; amount: number; category?: string | null }>
): CostGroup[] {
  const byGroup: Record<string, CostGroup['bills']> = {};
  for (const b of bills) {
    const name = (b.bill_name ?? '').toLowerCase();
    const provider = (b.provider_name ?? '').toLowerCase();
    const combined = `${name} ${provider}`;
    let groupKey = 'Other';
    if (STREAMING_KEYWORDS.some((k) => combined.includes(k))) groupKey = 'Streaming & subscriptions';
    else if (UTILITY_KEYWORDS.some((k) => combined.includes(k))) groupKey = 'Utilities';
    else if (b.category) groupKey = b.category;
    if (!byGroup[groupKey]) byGroup[groupKey] = [];
    byGroup[groupKey].push({ bill_name: b.bill_name, provider_name: b.provider_name, amount: Number(b.amount) });
  }
  return Object.entries(byGroup).map(([label, list]) => ({
    label,
    total: list.reduce((s, x) => s + x.amount, 0),
    bills: list,
  }));
}

export async function generateMonthlyReportData(userId: string): Promise<MonthlyReportData> {
  const base = await fetchHouseholdReportData(userId);
  const extended: MonthlyReportData = {
    ...base,
    costGroups: [],
    trends: [],
    upcomingHighlights: [],
  };

  if (!hasSupabaseConfig) return extended;

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const in30 = format(addDays(now, 30), 'yyyy-MM-dd');

  // --- All active bills for cost groups and trends ---
  try {
    const { data: bills } = await supabase
      .from('bills')
      .select('bill_name, provider_name, amount, category, due_date, status')
      .eq('user_id', userId)
      .neq('status', 'cancelled');
    const list = (bills ?? []) as Array<{ bill_name: string; provider_name: string | null; amount: number; category: string | null; due_date: string; status: string }>;
    extended.costGroups = groupBillsByCategory(list);

    // Trends: last 3 months (paid amounts)
    const { data: paid } = await supabase
      .from('bills')
      .select('paid_amount, amount, paid_date')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .not('paid_date', 'is', null);
    const paidList = (paid ?? []) as Array<{ paid_amount: number | null; amount: number; paid_date: string }>;
    for (let i = 0; i < 3; i++) {
      const monthStart = format(subMonths(now, i), 'yyyy-MM-01');
      const monthEnd = format(subMonths(now, i), 'yyyy-MM-dd');
      const inMonth = paidList.filter((p) => p.paid_date >= monthStart && p.paid_date <= monthEnd);
      extended.trends.push({
        month: format(subMonths(now, i), 'MMMM'),
        total: inMonth.reduce((s, p) => s + (Number(p.paid_amount) || Number(p.amount)), 0),
        count: inMonth.length,
      });
    }
  } catch {}

  // --- Upcoming highlights: next 3 bills, next 2 appointments, birthdays, registration, pets ---
  try {
    const { data: pendingBills } = await supabase
      .from('bills')
      .select('bill_name, provider_name, due_date, amount')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', today)
      .lte('due_date', in30)
      .order('due_date', { ascending: true })
      .limit(5);
    (pendingBills ?? []).forEach((b: { bill_name: string; due_date: string; amount: number }) => {
      extended.upcomingHighlights.push({
        type: 'bill',
        label: b.bill_name,
        date: b.due_date,
        detail: `$${Number(b.amount).toFixed(2)} due`,
      });
    });

    const { data: appts } = await supabase
      .from('appointments')
      .select('title, appointment_date, appointment_time')
      .eq('user_id', userId)
      .gte('appointment_date', today)
      .lte('appointment_date', in30)
      .order('appointment_date', { ascending: true })
      .limit(3);
    (appts ?? []).forEach((a: { title: string; appointment_date: string; appointment_time: string | null }) => {
      extended.upcomingHighlights.push({
        type: 'appointment',
        label: a.title,
        date: a.appointment_date,
        detail: a.appointment_time ?? undefined,
      });
    });
  } catch {}

  base.family.filter((f) => f.birthdayLabel).forEach((f) => {
    extended.upcomingHighlights.push({
      type: 'birthday',
      label: `${f.name}'s birthday`,
      detail: f.birthdayLabel ?? undefined,
    });
  });

  base.vehicles.filter((v) => v.registrationLabel).forEach((v) => {
    extended.upcomingHighlights.push({
      type: 'registration',
      label: v.label,
      detail: v.registrationLabel,
    });
  });

  base.pets.filter((p) => p.vaccinationDueLabel).forEach((p) => {
    extended.upcomingHighlights.push({
      type: 'vaccination',
      label: `${p.name} — vaccines`,
      detail: p.vaccinationDueLabel,
    });
  });

  return extended;
}

// --- Persist to monthly_reports ---
export type SavedMonthlyReport = {
  id: string;
  user_id: string;
  report_month: string;
  summary_text: string;
  suggestions: string[];
  highlights: string[];
  cost_analysis: Record<string, unknown> | null;
  share_token: string | null;
  created_at: string;
};

export async function saveMonthlyReport(
  userId: string,
  reportMonth: string,
  payload: {
    summary: string;
    highlights: string[];
    suggestions: string[];
    costAnalysis?: Record<string, unknown>;
  }
): Promise<SavedMonthlyReport | null> {
  if (!hasSupabaseConfig) return null;
  try {
    const existing = await getMonthlyReport(userId, reportMonth);
    const shareToken = `mr_${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const row = {
      user_id: userId,
      report_month: reportMonth,
      summary_text: payload.summary,
      highlights: payload.highlights,
      suggestions: payload.suggestions,
      cost_analysis: payload.costAnalysis ?? null,
      share_token: shareToken,
    };
    if (existing) {
      const { data, error } = await supabase
        .from('monthly_reports')
        .update({
          summary_text: row.summary_text,
          highlights: row.highlights,
          suggestions: row.suggestions,
          cost_analysis: row.cost_analysis,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return null;
      return data as SavedMonthlyReport;
    }
    const { data, error } = await supabase.from('monthly_reports').insert(row).select().single();
    if (error) return null;
    return data as SavedMonthlyReport;
  } catch {
    return null;
  }
}

/** Get stored report for a given month (yyyy-MM-01). */
export async function getMonthlyReport(
  userId: string,
  reportMonth: string
): Promise<SavedMonthlyReport | null> {
  if (!hasSupabaseConfig) return null;
  try {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('report_month', reportMonth)
      .maybeSingle();
    if (error || !data) return null;
    return data as SavedMonthlyReport;
  } catch {
    return null;
  }
}

/** Check if we should run monthly report (1st of month and no report for current month). */
export function shouldRunMonthlyReportToday(): boolean {
  const d = new Date();
  return d.getDate() === 1;
}
