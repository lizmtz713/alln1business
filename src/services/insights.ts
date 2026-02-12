import { z } from 'zod';
import { supabase, hasSupabaseConfig } from './supabase';
import { buildBusinessContext, type BusinessContext } from './aiContext';
import { hasOpenAIKey } from './openai';

// --- Schemas ---
const insightTypeSchema = z.enum(['win', 'warning', 'tip', 'action']);
const sourceSchema = z.enum(['rule', 'ai']);

export const insightDraftSchema = z.object({
  type: insightTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  cta_label: z.string().max(50).nullable().optional(),
  cta_route: z.string().max(200).nullable().optional(),
});

export const aiInsightItemSchema = z.object({
  type: insightTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  cta_label: z.string().max(50).nullable().optional(),
  cta_route: z.string().max(200).nullable().optional(),
});

export const aiInsightsResponseSchema = z.array(aiInsightItemSchema);

export type InsightDraft = z.infer<typeof insightDraftSchema>;

export type DashboardInsight = {
  id: string;
  user_id: string;
  insight_date: string;
  title: string;
  body: string;
  insight_type: 'win' | 'warning' | 'tip' | 'action';
  source: 'rule' | 'ai';
  cta_label: string | null;
  cta_route: string | null;
  dismissed: boolean;
  created_at: string;
};

// --- Rule-based insights ---
export function generateRuleInsights(context: BusinessContext): InsightDraft[] {
  const insights: InsightDraft[] = [];

  // 1) Overdue invoices
  if (context.unpaidInvoices.overdue.length > 0) {
    const count = context.unpaidInvoices.overdue.length;
    const total = context.unpaidInvoices.overdue.reduce((s, i) => s + Number(i.total), 0);
    insights.push({
      type: 'warning',
      title: 'Overdue invoices',
      body: `You have ${count} overdue invoice${count === 1 ? '' : 's'} totaling $${total.toFixed(2)}.`,
      cta_label: 'View Invoices',
      cta_route: '/(tabs)/documents',
    });
  }

  // 2) Bills due this week
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekEnd = weekFromNow.toISOString().split('T')[0];
  const billsDueThisWeek = context.upcomingBills.next.filter((b) => b.due_date >= today && b.due_date <= weekEnd);
  if (billsDueThisWeek.length > 0) {
    const count = billsDueThisWeek.length;
    const total = billsDueThisWeek.reduce((s, b) => s + Number(b.amount), 0);
    insights.push({
      type: 'action',
      title: 'Bills due this week',
      body: `${count} bill${count === 1 ? '' : 's'} due in the next 7 days ($${total.toFixed(2)}).`,
      cta_label: 'View Bills',
      cta_route: '/(tabs)/documents',
    });
  }

  // 3) Spend spike
  if (
    context.prev7DaysExpense > 0 &&
    context.last7DaysExpense > context.prev7DaysExpense * 1.25
  ) {
    const pct = Math.round(((context.last7DaysExpense - context.prev7DaysExpense) / context.prev7DaysExpense) * 100);
    insights.push({
      type: 'warning',
      title: 'Spend spike detected',
      body: `Expenses are up ${pct}% vs the previous 7 days ($${context.last7DaysExpense.toFixed(2)} vs $${context.prev7DaysExpense.toFixed(2)}).`,
      cta_label: 'View Transactions',
      cta_route: '/(tabs)/transactions',
    });
  }

  // 4) Win - profitable this month
  if (
    context.monthlyStats.hasData &&
    context.monthlyStats.profit > 0 &&
    context.monthlyStats.income >= context.monthlyStats.expenses
  ) {
    insights.push({
      type: 'win',
      title: "You're profitable this month",
      body: `Nice! Income $${context.monthlyStats.income.toFixed(2)} exceeds expenses $${context.monthlyStats.expenses.toFixed(2)}.`,
      cta_label: null,
      cta_route: null,
    });
  }

  // 5) No data tip
  if (!context.monthlyStats.hasData && context.lastTransactions.length === 0 && insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Add your first transactions',
      body: 'Track income and expenses to see insights here.',
      cta_label: 'Add Transaction',
      cta_route: '/(tabs)/transactions',
    });
  }

  return insights.slice(0, 3);
}

// --- Quarterly estimate insight (Phase 4G) ---
export async function generateQuarterlyEstimateInsight(userId: string): Promise<InsightDraft | null> {
  if (!hasSupabaseConfig) return null;
  try {
    const today = getLocalDateString();
    const now = new Date();
    const year = now.getFullYear();
    const { getQuarterRanges } = await import('./quarterlyEstimates');

    const { data: payments } = await supabase
      .from('estimated_tax_payments')
      .select('quarter, due_date, total_estimated, paid')
      .eq('user_id', userId)
      .eq('tax_year', year);

    const ranges = getQuarterRanges(year);
    const todayTime = new Date(today).getTime();

    for (const p of payments ?? []) {
      const row = p as { quarter: number; due_date: string; total_estimated: number; paid: boolean };
      if (row.paid) continue;
      const dueTime = new Date(row.due_date).getTime();
      const diffDays = (dueTime - todayTime) / (24 * 60 * 60 * 1000);
      if (diffDays >= 0 && diffDays <= 14) {
        return {
          type: 'action',
          title: 'Quarterly tax estimate due soon',
          body: `Q${row.quarter} estimate is due ${row.due_date}. Estimated: $${Number(row.total_estimated).toFixed(2)} (based on your transactions).`,
          cta_label: 'View Estimates',
          cta_route: '/estimates',
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// --- AI insights (when OpenAI key exists) ---
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export async function generateAIInsights(context: BusinessContext): Promise<InsightDraft[]> {
  if (!hasOpenAIKey || !OPENAI_API_KEY) return [];

  const ctxText = [
    `Business: ${context.profile.business_name || context.profile.business_type || 'Not set'}`,
    context.monthlyStats.hasData
      ? `This month: Income $${context.monthlyStats.income.toFixed(2)}, Expenses $${context.monthlyStats.expenses.toFixed(2)}, Profit $${context.monthlyStats.profit.toFixed(2)}`
      : 'This month: No transaction data',
    `Unpaid invoices: ${context.unpaidInvoices.count} totaling $${context.unpaidInvoices.total.toFixed(2)}`,
    `Upcoming bills: ${context.upcomingBills.count} totaling $${context.upcomingBills.total.toFixed(2)}`,
    `Recent transactions: ${context.lastTransactions.length}`,
  ].join('\n');

  const prompt = `You are a helpful business insights assistant. Based on this data, suggest up to 2 short, actionable insights for a small business owner. Return ONLY a valid JSON array, no other text.

Data:
${ctxText}

Return format (JSON array only):
[{"type":"tip","title":"...","body":"...","cta_label":"...","cta_route":"..."}]

Allowed types: win, warning, tip, action
cta_route examples: "/(tabs)/documents", "/(tabs)/transactions"
Keep title under 40 chars, body under 150 chars.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
      }),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const result = aiInsightsResponseSchema.safeParse(parsed);
    if (!result.success) return [];

    return result.data.map((i) => ({
      type: i.type,
      title: i.title.slice(0, 200),
      body: i.body.slice(0, 500),
      cta_label: i.cta_label ?? null,
      cta_route: i.cta_route ?? null,
    }));
  } catch {
    return [];
  }
}

function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function upsertInsightsForToday(userId: string): Promise<DashboardInsight[]> {
  if (!hasSupabaseConfig) return [];

  const today = getLocalDateString();

  const { data: allToday } = await supabase
    .from('dashboard_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('insight_date', today)
    .order('created_at', { ascending: true });

  const nonDismissed = (allToday ?? []).filter((r) => !(r as { dismissed?: boolean }).dismissed) as DashboardInsight[];
  if (allToday && allToday.length > 0) {
    return nonDismissed;
  }

  const context = await buildBusinessContext(userId);
  const ruleInsights = generateRuleInsights(context);
  const quarterlyInsight = await generateQuarterlyEstimateInsight(userId);
  let aiInsights: InsightDraft[] = [];

  if (hasOpenAIKey) {
    aiInsights = await generateAIInsights(context);
  }

  const merged: Array<{ draft: InsightDraft; source: 'rule' | 'ai' }> = [];
  const seenTitles = new Set<string>();

  if (quarterlyInsight && !seenTitles.has(quarterlyInsight.title)) {
    seenTitles.add(quarterlyInsight.title);
    merged.push({ draft: quarterlyInsight, source: 'rule' });
  }

  for (const r of ruleInsights) {
    if (!seenTitles.has(r.title)) {
      seenTitles.add(r.title);
      merged.push({ draft: r, source: 'rule' });
    }
  }
  for (const a of aiInsights.slice(0, 2)) {
    if (!seenTitles.has(a.title) && merged.length < 3) {
      seenTitles.add(a.title);
      merged.push({ draft: a, source: 'ai' });
    }
  }

  for (const { draft, source } of merged) {
    await supabase.from('dashboard_insights').upsert(
      {
        user_id: userId,
        insight_date: today,
        title: draft.title,
        body: draft.body,
        insight_type: draft.type,
        source,
        cta_label: draft.cta_label ?? null,
        cta_route: draft.cta_route ?? null,
        dismissed: false,
      },
      { onConflict: 'user_id,insight_date,title', ignoreDuplicates: false }
    );
  }

  const { data: inserted } = await supabase
    .from('dashboard_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('insight_date', today)
    .eq('dismissed', false)
    .order('created_at', { ascending: true });

  return (inserted ?? []) as DashboardInsight[];
}

export async function dismissInsight(id: string): Promise<void> {
  if (!hasSupabaseConfig) return;
  await supabase.from('dashboard_insights').update({ dismissed: true }).eq('id', id);
}
