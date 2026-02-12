import { supabase, hasSupabaseConfig } from './supabase';

export type BusinessContext = {
  profile: { business_name: string | null; business_type: string | null; entity_type: string | null };
  monthlyStats: { income: number; expenses: number; profit: number; hasData: boolean };
  lastTransactions: Array<{ date: string; vendor: string; amount: number; category: string }>;
  unpaidInvoices: { count: number; total: number; overdue: Array<{ invoice_number: string; total: number; due_date: string }> };
  upcomingBills: { count: number; total: number; next: Array<{ bill_name: string; amount: number; due_date: string }> };
  recentDocuments: Array<{ name: string; doc_type: string; created_at: string }>;
};

export async function buildBusinessContext(userId: string): Promise<BusinessContext> {
  const empty: BusinessContext = {
    profile: { business_name: null, business_type: null, entity_type: null },
    monthlyStats: { income: 0, expenses: 0, profit: 0, hasData: false },
    lastTransactions: [],
    unpaidInvoices: { count: 0, total: 0, overdue: [] },
    upcomingBills: { count: 0, total: 0, next: [] },
    recentDocuments: [],
  };
  if (!hasSupabaseConfig) return empty;

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  const profile = { business_name: null as string | null, business_type: null as string | null, entity_type: null as string | null };
  let monthlyStats = { income: 0, expenses: 0, profit: 0, hasData: false };
  let lastTransactions: BusinessContext['lastTransactions'] = [];
  let unpaidInvoices = { count: 0, total: 0, overdue: [] as BusinessContext['unpaidInvoices']['overdue'] };
  let upcomingBills = { count: 0, total: 0, next: [] as BusinessContext['upcomingBills']['next'] };
  let recentDocuments: BusinessContext['recentDocuments'] = [];

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('business_name, business_type, entity_type')
      .eq('id', userId)
      .single();
    if (prof) {
      profile.business_name = (prof as { business_name?: string }).business_name ?? null;
      profile.business_type = (prof as { business_type?: string }).business_type ?? null;
      profile.entity_type = (prof as { entity_type?: string }).entity_type ?? null;
    }
  } catch {
    /* ignore */
  }

  try {
    const { data: txns } = await supabase
      .from('transactions')
      .select('date, vendor, amount, type, category')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
    if (txns && txns.length > 0) {
      let income = 0;
      let expenses = 0;
      for (const t of txns as Array<{ amount: number; type: string }>) {
        const amt = Number(t.amount);
        if (t.type === 'income') income += amt;
        else expenses += Math.abs(amt);
      }
      monthlyStats = { income, expenses, profit: income - expenses, hasData: true };
    }
  } catch {
    /* ignore */
  }

  try {
    const { data: txns } = await supabase
      .from('transactions')
      .select('date, vendor, amount, type, category')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    if (txns) {
      lastTransactions = (txns as Array<{ date: string; vendor: string | null; amount: number; type: string; category: string | null }>).map((t) => ({
        date: t.date,
        vendor: t.vendor ?? 'Unknown',
        amount: t.type === 'income' ? Number(t.amount) : -Math.abs(Number(t.amount)),
        category: t.category ?? 'other',
      }));
    }
  } catch {
    /* ignore */
  }

  try {
    const today = now.toISOString().split('T')[0];
    const { data: invs } = await supabase
      .from('invoices')
      .select('invoice_number, total, due_date')
      .eq('user_id', userId)
      .in('status', ['sent', 'viewed', 'overdue'])
      .order('due_date', { ascending: true });
    if (invs) {
      const unpaid = (invs as Array<{ invoice_number: string; total: number; due_date: string }>).filter(
        (i) => i.due_date
      );
      unpaidInvoices = {
        count: unpaid.length,
        total: unpaid.reduce((s, i) => s + Number(i.total), 0),
        overdue: unpaid.filter((i) => i.due_date < today).slice(0, 5),
      };
    }
  } catch {
    /* ignore */
  }

  try {
    const { data: bills } = await supabase
      .from('bills')
      .select('bill_name, amount, due_date')
      .eq('user_id', userId)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
      .limit(10);
    if (bills) {
      const pending = bills as Array<{ bill_name: string; amount: number; due_date: string }>;
      upcomingBills = {
        count: pending.length,
        total: pending.reduce((s, b) => s + Number(b.amount), 0),
        next: pending.slice(0, 5),
      };
    }
  } catch {
    /* ignore */
  }

  try {
    const { data: docs } = await supabase
      .from('documents')
      .select('name, doc_type, created_at')
      .eq('user_id', userId)
      .eq('is_template', false)
      .order('created_at', { ascending: false })
      .limit(5);
    if (docs) {
      recentDocuments = (docs as Array<{ name: string; doc_type: string; created_at: string }>).map((d) => ({
        name: d.name,
        doc_type: d.doc_type,
        created_at: d.created_at,
      }));
    }
  } catch {
    /* ignore */
  }

  return {
    profile,
    monthlyStats,
    lastTransactions,
    unpaidInvoices,
    upcomingBills,
    recentDocuments,
  };
}

export function makeSystemPrompt(context: BusinessContext): string {
  const lines: string[] = [
    'You are a helpful, supportive business assistant for Alln1 Business. Use plain English. Be concise—keep responses under ~200 words unless the user asks for more. Never give legal or tax advice; only general guidance. If data is missing or sparse, say so honestly and suggest next steps like adding transactions, creating an invoice, or connecting a bank account.',
    '',
    'Current business context (user data):',
  ];

  const name = context.profile.business_name || context.profile.business_type || 'Not set';
  lines.push(`- Business: ${name}`);
  if (context.profile.entity_type) lines.push(`- Entity type: ${context.profile.entity_type}`);

  if (context.monthlyStats.hasData) {
    lines.push(
      `- This month: Income $${context.monthlyStats.income.toFixed(2)}, Expenses $${context.monthlyStats.expenses.toFixed(2)}, Profit $${context.monthlyStats.profit.toFixed(2)}`
    );
  } else {
    lines.push('- This month: No transaction data yet');
  }

  if (context.lastTransactions.length > 0) {
    lines.push('- Recent transactions (last 10):');
    for (const t of context.lastTransactions.slice(0, 5)) {
      lines.push(`  - ${t.date}: ${t.vendor} $${t.amount.toFixed(2)} (${t.category})`);
    }
  }

  if (context.unpaidInvoices.count > 0) {
    lines.push(
      `- Unpaid invoices: ${context.unpaidInvoices.count} totaling $${context.unpaidInvoices.total.toFixed(2)}`
    );
    if (context.unpaidInvoices.overdue.length > 0) {
      lines.push('  Overdue: ' + context.unpaidInvoices.overdue.map((i) => `${i.invoice_number} $${Number(i.total).toFixed(2)}`).join(', '));
    }
  } else {
    lines.push('- Unpaid invoices: None');
  }

  if (context.upcomingBills.count > 0) {
    lines.push(
      `- Upcoming bills: ${context.upcomingBills.count} totaling $${context.upcomingBills.total.toFixed(2)}`
    );
    if (context.upcomingBills.next.length > 0) {
      lines.push('  Next: ' + context.upcomingBills.next.map((b) => `${b.bill_name} $${Number(b.amount).toFixed(2)} (due ${b.due_date})`).join('; '));
    }
  } else {
    lines.push('- Upcoming bills: None');
  }

  if (context.recentDocuments.length > 0) {
    lines.push('- Recent documents: ' + context.recentDocuments.map((d) => `${d.name} (${d.doc_type})`).join(', '));
  }

  lines.push('');
  lines.push('Answer the user based on this context. For document drafting (NDA, agreements), point them to the Templates section.');
  return lines.join('\n');
}
