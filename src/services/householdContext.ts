import { supabase, hasSupabaseConfig } from './supabase';
import { addDays, format } from 'date-fns';

export type HouseholdContext = {
  /** Pending bills: name, provider, amount, due_date, id for mark_paid */
  bills: Array<{ id: string; bill_name: string; provider_name: string | null; amount: number; due_date: string; status: string }>;
  /** Vehicles: make, model, year, registration_expiry, insurance_expiry */
  vehicles: Array<{ make: string | null; model: string | null; year: number | null; registration_expiry: string | null; insurance_expiry: string | null }>;
  /** Pets: name, type, breed, vet_name, vet_phone */
  pets: Array<{ name: string; type: string | null; breed: string | null; vet_name: string | null; vet_phone: string | null; notes: string | null }>;
  /** Appointments: title, date, time, location (so we can answer "When is Jake's dentist?") */
  appointments: Array<{ id: string; title: string; appointment_date: string; appointment_time: string | null; location: string | null }>;
  /** Insurance: provider, policy_number, renewal_date */
  insurance: Array<{ provider: string; policy_number: string | null; renewal_date: string | null }>;
  /** Medical records: provider, record_date, record_type, notes */
  medical: Array<{ provider: string | null; record_date: string | null; record_type: string | null; notes: string | null }>;
  /** Home service contacts: name, service_type, phone */
  homeServices: Array<{ name: string; service_type: string; phone: string | null }>;
  /** Monthly spending by category (e.g. subscriptions = sum of expense category) */
  monthlySpending: { total: number; byCategory: Record<string, number> };
  /** Shopping list items (for context; add_to_list is an action) */
  shoppingList: string[];
};

const emptyContext: HouseholdContext = {
  bills: [],
  vehicles: [],
  pets: [],
  appointments: [],
  insurance: [],
  medical: [],
  homeServices: [],
  monthlySpending: { total: 0, byCategory: {} },
  shoppingList: [],
};

export async function buildHouseholdContext(userId: string): Promise<HouseholdContext> {
  if (!hasSupabaseConfig) return emptyContext;

  const now = new Date();
  const startOfMonth = format(now, 'yyyy-MM-01');
  const endOfMonth = format(addDays(now, 31), 'yyyy-MM-dd'); // approximate

  const ctx: HouseholdContext = { ...emptyContext };

  try {
    const { data: bills } = await supabase
      .from('bills')
      .select('id, bill_name, provider_name, amount, due_date, status')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });
    if (bills) ctx.bills = bills as HouseholdContext['bills'];
  } catch {}

  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('make, model, year, registration_expiry, insurance_expiry')
      .eq('user_id', userId);
    if (vehicles) ctx.vehicles = vehicles as HouseholdContext['vehicles'];
  } catch {}

  try {
    const { data: pets } = await supabase
      .from('pets')
      .select('name, type, breed, vet_name, vet_phone, notes')
      .eq('user_id', userId);
    if (pets) ctx.pets = pets as HouseholdContext['pets'];
  } catch {}

  try {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, title, appointment_date, appointment_time, location')
      .eq('user_id', userId)
      .gte('appointment_date', format(now, 'yyyy-MM-dd'))
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true, nullsFirst: false })
      .limit(50);
    if (appointments) ctx.appointments = appointments as HouseholdContext['appointments'];
  } catch {}

  try {
    const { data: insurance } = await supabase
      .from('insurance_policies')
      .select('provider, policy_number, renewal_date')
      .eq('user_id', userId);
    if (insurance) ctx.insurance = insurance as HouseholdContext['insurance'];
  } catch {}

  try {
    const { data: medical } = await supabase
      .from('medical_records')
      .select('provider, record_date, record_type, notes')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .limit(20);
    if (medical) ctx.medical = medical as HouseholdContext['medical'];
  } catch {}

  try {
    const { data: homeServices } = await supabase
      .from('home_service_contacts')
      .select('name, service_type, phone')
      .eq('user_id', userId);
    if (homeServices) ctx.homeServices = homeServices as HouseholdContext['homeServices'];
  } catch {}

  try {
    const { data: txns } = await supabase
      .from('transactions')
      .select('amount, type, category')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
    if (txns && Array.isArray(txns)) {
      const byCategory: Record<string, number> = {};
      let total = 0;
      for (const t of txns as Array<{ amount: number; type: string; category: string | null }>) {
        if (t.type === 'expense') {
          const amt = Math.abs(Number(t.amount));
          total += amt;
          const cat = t.category || 'other';
          byCategory[cat] = (byCategory[cat] || 0) + amt;
        }
      }
      ctx.monthlySpending = { total, byCategory };
    }
  } catch {}

  try {
    const { data: list } = await supabase
      .from('shopping_list')
      .select('item')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('added_at', { ascending: false });
    if (list && Array.isArray(list)) ctx.shoppingList = (list as Array<{ item: string }>).map((r) => r.item);
  } catch {}

  return ctx;
}

/** Format context for the AI system prompt. Include everything so the assistant can answer queries and suggest actions. */
export function makeHouseholdSystemPrompt(ctx: HouseholdContext): string {
  const lines: string[] = [
    'You are a friendly, knowledgeable family assistant for this household. You have access to ALL of their data below. Use it to answer questions accurately (e.g. "When is Jake\'s dentist?" → find an appointment whose title mentions Jake and dentist). Be concise but warm. If the user asks you to DO something, use the provided tools (add_reminder, add_to_list, mark_paid, schedule_appointment).',
    '',
    'When answering:',
    '- Bills: use bill_name, provider_name, amount, due_date. "Bills due this week" = due_date in the next 7 days.',
    '- Vehicles: registration_expiry and insurance_expiry are dates; say when they are due.',
    '- Pets: vet_name and vet_phone for "dog\'s vet number".',
    '- Appointments: title often includes who (e.g. "Jake - dentist"); use appointment_date and appointment_time.',
    '- Spending: monthlySpending.byCategory shows categories (utilities, insurance, etc.); "subscriptions" might be under a category or sum recurring bills.',
    '',
    'Proactive suggestions: If you notice something important (e.g. car insurance expires next month, a bill due tomorrow), you may mention it briefly at the end of your reply.',
    '',
    '--- HOUSEHOLD DATA ---',
  ];

  if (ctx.bills.length > 0) {
    lines.push('BILLS (id, bill_name, provider_name, amount, due_date, status):');
    ctx.bills.forEach((b) => {
      lines.push(`  ${b.id} | ${b.bill_name} | ${b.provider_name ?? '—'} | $${Number(b.amount).toFixed(2)} | due ${b.due_date} | ${b.status}`);
    });
    lines.push('');
  }

  if (ctx.vehicles.length > 0) {
    lines.push('VEHICLES (make, model, year, registration_expiry, insurance_expiry):');
    ctx.vehicles.forEach((v) => {
      lines.push(`  ${v.year ?? '—'} ${v.make ?? ''} ${v.model ?? ''} | reg ${v.registration_expiry ?? '—'} | ins ${v.insurance_expiry ?? '—'}`);
    });
    lines.push('');
  }

  if (ctx.pets.length > 0) {
    lines.push('PETS (name, type, breed, vet_name, vet_phone, notes):');
    ctx.pets.forEach((p) => {
      lines.push(`  ${p.name} | ${p.type ?? '—'} | ${p.breed ?? '—'} | vet: ${p.vet_name ?? '—'} ${p.vet_phone ?? ''} | ${p.notes ?? ''}`);
    });
    lines.push('');
  }

  if (ctx.appointments.length > 0) {
    lines.push('APPOINTMENTS (title, date, time, location):');
    ctx.appointments.forEach((a) => {
      lines.push(`  ${a.title} | ${a.appointment_date} ${a.appointment_time ?? ''} | ${a.location ?? ''}`);
    });
    lines.push('');
  }

  if (ctx.insurance.length > 0) {
    lines.push('INSURANCE (provider, policy_number, renewal_date):');
    ctx.insurance.forEach((i) => {
      lines.push(`  ${i.provider} | ${i.policy_number ?? '—'} | renewal ${i.renewal_date ?? '—'}`);
    });
    lines.push('');
  }

  if (ctx.medical.length > 0) {
    lines.push('MEDICAL RECORDS (provider, record_date, record_type, notes):');
    ctx.medical.slice(0, 10).forEach((m) => {
      lines.push(`  ${m.provider ?? '—'} | ${m.record_date ?? '—'} | ${m.record_type ?? '—'} | ${(m.notes ?? '').slice(0, 60)}`);
    });
    lines.push('');
  }

  if (ctx.homeServices.length > 0) {
    lines.push('HOME SERVICE CONTACTS (name, service_type, phone):');
    ctx.homeServices.forEach((h) => {
      lines.push(`  ${h.name} | ${h.service_type} | ${h.phone ?? '—'}`);
    });
    lines.push('');
  }

  if (ctx.monthlySpending.total > 0) {
    lines.push('MONTHLY SPENDING (this month):');
    lines.push(`  Total expenses: $${ctx.monthlySpending.total.toFixed(2)}`);
    Object.entries(ctx.monthlySpending.byCategory).forEach(([cat, amt]) => {
      lines.push(`  ${cat}: $${amt.toFixed(2)}`);
    });
    lines.push('');
  }

  if (ctx.shoppingList.length > 0) {
    lines.push('SHOPPING LIST: ' + ctx.shoppingList.join(', '));
    lines.push('');
  }

  lines.push('--- END HOUSEHOLD DATA ---');
  return lines.join('\n');
}
