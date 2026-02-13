/**
 * Monthly household report: aggregates spending, family, vehicles, pets, upcoming.
 * Used to generate AI-powered report text.
 */
import { supabase, hasSupabaseConfig } from './supabase';
import { format, parseISO, addMonths, subMonths, differenceInDays, differenceInCalendarMonths } from 'date-fns';
import { computeRawPredictions } from './predictions';

export type ReportSpending = {
  thisMonthTotal: number;
  thisMonthCount: number;
  lastMonthTotal: number;
  lastMonthName: string;
  percentChange: number | null; // e.g. -5 for "down 5%"
};

export type ReportFamilyMember = {
  name: string;
  relationship?: string | null;
  birthdayInDays?: number | null; // days until next birthday
  birthdayLabel?: string; // e.g. "in 2 weeks"
};

export type ReportGrowth = {
  name: string;
  nextShoeSize?: string;
  monthsUntilNextSize?: number;
  growthNote?: string; // e.g. "grew 0.5 size"
};

export type ReportVehicle = {
  label: string;
  registrationExpiry?: string | null;
  registrationLabel?: string; // e.g. "good until August"
  oilChangeMessage?: string; // e.g. "Oil change due in 300 miles"
};

export type ReportPet = {
  name: string;
  type?: string | null;
  vaccinationDueLabel?: string; // e.g. "due for annual vaccines next month"
};

export type ReportUpcoming = {
  appointmentsCount: number;
  billsDueCount: number;
};

export type HouseholdReportData = {
  monthName: string;
  year: number;
  spending: ReportSpending | null;
  family: ReportFamilyMember[];
  growth: ReportGrowth[];
  vehicles: ReportVehicle[];
  pets: ReportPet[];
  upcoming: ReportUpcoming;
};

function daysUntilNextBirthday(birthdayStr: string): number {
  const d = parseISO(birthdayStr);
  const now = new Date();
  let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next < now) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
  return differenceInDays(next, now);
}

function birthdayLabel(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return 'this week';
  if (days <= 14) return 'in 2 weeks';
  if (days <= 21) return 'in 3 weeks';
  if (days <= 31) return 'next month';
  const months = Math.floor(days / 30);
  return months <= 1 ? 'next month' : `in ${months} months`;
}

function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/** Parse pet vaccination_dates (e.g. "Rabies 2024-01; DHPP 2024-02") and infer if due "next month" */
function vaccinationDueLabel(vaccinationDates: string | null | undefined): string | undefined {
  if (!vaccinationDates || !vaccinationDates.trim()) return undefined;
  const now = new Date();
  const nextMonth = addMonths(now, 1);
  const nextMonthStr = format(nextMonth, 'yyyy-MM');
  // If any vaccine mention has a date in the past year, suggest "due for annual vaccines next month"
  const parts = vaccinationDates.split(/[;,]/).map((p) => p.trim());
  for (const p of parts) {
    const m = p.match(/(\d{4})-?(\d{2})?/);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = m[2] ? parseInt(m[2], 10) : 1;
      const lastVacc = new Date(year, month - 1, 1);
      const monthsAgo = differenceInCalendarMonths(now, lastVacc);
      if (monthsAgo >= 10 && monthsAgo <= 14) return 'due for annual vaccines next month';
      if (monthsAgo >= 11) return 'due for vaccines soon';
    }
  }
  return undefined;
}

export async function fetchHouseholdReportData(userId: string): Promise<HouseholdReportData> {
  const now = new Date();
  const thisMonthStart = format(now, 'yyyy-MM-01');
  const thisMonthEnd = format(now, 'yyyy-MM-dd');
  const lastMonthStart = format(subMonths(now, 1), 'yyyy-MM-01');
  const lastMonthEnd = format(subMonths(now, 1), 'yyyy-MM-dd');
  const lastMonthName = format(subMonths(now, 1), 'MMMM');
  const monthName = format(now, 'MMMM');
  const year = now.getFullYear();

  const result: HouseholdReportData = {
    monthName,
    year,
    spending: null,
    family: [],
    growth: [],
    vehicles: [],
    pets: [],
    upcoming: { appointmentsCount: 0, billsDueCount: 0 },
  };

  if (!hasSupabaseConfig) return result;

  // --- Spending: bills paid this month vs last month ---
  try {
    const { data: bills } = await supabase
      .from('bills')
      .select('amount, paid_amount, paid_date, status')
      .eq('user_id', userId)
      .neq('status', 'cancelled');
    const list = (bills ?? []) as Array<{ amount: number; paid_amount: number | null; paid_date: string | null; status: string }>;
    const paidThisMonth = list.filter((b) => b.status === 'paid' && b.paid_date && b.paid_date >= thisMonthStart && b.paid_date <= thisMonthEnd);
    const paidLastMonth = list.filter((b) => b.status === 'paid' && b.paid_date && b.paid_date >= lastMonthStart && b.paid_date <= lastMonthEnd);
    const thisMonthTotal = paidThisMonth.reduce((s, b) => s + (Number(b.paid_amount) || Number(b.amount)), 0);
    const lastMonthTotal = paidLastMonth.reduce((s, b) => s + (Number(b.paid_amount) || Number(b.amount)), 0);
    let percentChange: number | null = null;
    if (lastMonthTotal > 0) {
      percentChange = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
    }
    result.spending = {
      thisMonthTotal,
      thisMonthCount: paidThisMonth.length,
      lastMonthTotal,
      lastMonthName,
      percentChange,
    };
  } catch {}

  // --- Family: household_members with optional birthday ---
  try {
    const { data: members, error } = await supabase
      .from('household_members')
      .select('name, relationship, birthday')
      .eq('user_id', userId);
    const memberList = (members ?? []) as Array<{ name: string; relationship: string | null; birthday?: string | null }>;
    if (error && /column.*birthday|42703/i.test(error.message)) {
      const { data: fallback } = await supabase.from('household_members').select('name, relationship').eq('user_id', userId);
      (fallback ?? []).forEach((row, i) => {
        result.family.push({ name: (row as { name: string }).name, relationship: (row as { relationship: string | null }).relationship });
      });
    } else {
      result.family = memberList.map((m) => {
      let birthdayInDays: number | null = null;
      let birthdayLabelStr: string | undefined;
      if (m.birthday) {
        birthdayInDays = daysUntilNextBirthday(m.birthday);
        birthdayLabelStr = birthdayLabel(birthdayInDays);
      }
      return {
        name: m.name,
        relationship: m.relationship,
        birthdayInDays,
        birthdayLabel: birthdayLabelStr,
      };
    });
    }
  } catch {}

  // --- Growth: from predictions ---
  try {
    const raw = await computeRawPredictions(userId);
    result.growth = raw.growth.map((g) => ({
      name: g.name,
      nextShoeSize: g.nextShoeSize,
      monthsUntilNextSize: g.monthsUntilNextSize,
      growthNote: g.growthNote ?? (g.nextShoeSize ? `grew toward size ${g.nextShoeSize}` : undefined),
    }));
  } catch {}

  // --- Vehicles: list + maintenance predictions ---
  try {
    const raw = await computeRawPredictions(userId);
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, year, make, model, registration_expiry')
      .eq('user_id', userId);
    const vList = (vehicles ?? []) as Array<{ id: string; year: number | null; make: string | null; model: string | null; registration_expiry: string | null }>;
    const maintenanceByVehicle: Record<string, string> = {};
    raw.maintenance.forEach((m) => {
      maintenanceByVehicle[m.vehicleId] = m.message;
    });
    result.vehicles = vList.map((v) => {
      const label = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
      let registrationLabel: string | undefined;
      if (v.registration_expiry) {
        const d = parseISO(v.registration_expiry);
        registrationLabel = `good until ${format(d, 'MMMM')}`;
      }
      return {
        label,
        registrationExpiry: v.registration_expiry,
        registrationLabel,
        oilChangeMessage: maintenanceByVehicle[v.id],
      };
    });
  } catch {}

  // --- Pets: vaccination due ---
  try {
    const { data: pets } = await supabase
      .from('pets')
      .select('name, type, vaccination_dates')
      .eq('user_id', userId);
    const petList = (pets ?? []) as Array<{ name: string; type: string | null; vaccination_dates: string | null }>;
    result.pets = petList.map((p) => ({
      name: p.name,
      type: p.type,
      vaccinationDueLabel: vaccinationDueLabel(p.vaccination_dates),
    }));
  } catch {}

  // --- Upcoming: appointments and bills due (next 30 days) ---
  try {
    const today = format(now, 'yyyy-MM-dd');
    const in30 = format(addMonths(now, 1), 'yyyy-MM-dd');
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', userId)
      .gte('appointment_date', today)
      .lte('appointment_date', in30);
    const { data: pendingBills } = await supabase
      .from('bills')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', today)
      .lte('due_date', in30);
    result.upcoming = {
      appointmentsCount: (appointments ?? []).length,
      billsDueCount: (pendingBills ?? []).length,
    };
  } catch {}

  return result;
}
