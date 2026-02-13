/**
 * Raw prediction data computed from household data. Used as input for AI to generate friendly text.
 */
import { supabase, hasSupabaseConfig } from './supabase';
import { addMonths, subMonths, format, parseISO, differenceInMonths } from 'date-fns';

export type RawSpendingPrediction = {
  nextMonthBillsTotal: number;
  nextMonthBillsCount: number;
  last3MonthsAvgExpenses: number;
  utilitiesSummerVsWinter?: number; // e.g. 1.2 = 20% higher in summer
};

export type RawGrowthPrediction = {
  name: string;
  nextShoeSize?: string;
  monthsUntilNextSize?: number;
  lastHeight?: number;
  lastRecordDate?: string;
  growthNote?: string;
};

export type RawMaintenancePrediction = {
  vehicleId: string;
  vehicleLabel: string;
  milesUntilOilChange?: number;
  oilChangeDateEstimate?: string;
  message: string;
};

export type RawHealthPrediction = {
  type: 'dental' | 'physical' | 'checkup';
  person?: string;
  monthsSince: number;
  lastDate?: string;
  message: string;
};

export type RawPredictions = {
  spending: RawSpendingPrediction | null;
  growth: RawGrowthPrediction[];
  maintenance: RawMaintenancePrediction[];
  health: RawHealthPrediction[];
};

function parseShoeSize(s: string | null | undefined): number | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

export async function computeRawPredictions(userId: string): Promise<RawPredictions> {
  const result: RawPredictions = {
    spending: null,
    growth: [],
    maintenance: [],
    health: [],
  };

  if (!hasSupabaseConfig) return result;

  const now = new Date();

  // --- Spending: bills next month + last 3 months expenses average ---
  try {
    const nextMonthStart = format(addMonths(now, 1), 'yyyy-MM-01');
    const nextMonthEnd = format(addMonths(now, 2), 'yyyy-MM-01');
    const { data: bills } = await supabase
      .from('bills')
      .select('amount, due_date, is_recurring')
      .eq('user_id', userId)
      .neq('status', 'cancelled');
    const billList = (bills ?? []) as Array<{ amount: number; due_date: string; is_recurring: boolean }>;
    const nextMonthBills = billList.filter((b) => b.due_date >= nextMonthStart && b.due_date < nextMonthEnd);
    const nextMonthTotal = nextMonthBills.reduce((s, b) => s + Number(b.amount), 0);

    const threeMonthsAgo = format(subMonths(now, 3), 'yyyy-MM-01');
    const { data: txns } = await supabase
      .from('transactions')
      .select('amount, type, date, category')
      .eq('user_id', userId)
      .gte('date', threeMonthsAgo)
      .lte('date', format(now, 'yyyy-MM-dd'));
    const txnList = (txns ?? []) as Array<{ amount: number; type: string; date: string; category: string | null }>;
    const expenses = txnList.filter((t) => t.type === 'expense').map((t) => Math.abs(Number(t.amount)));
    const last3Avg = expenses.length ? expenses.reduce((a, b) => a + b, 0) / 3 : 0;

    let utilitiesSummerVsWinter: number | undefined;
    const { data: allTxns } = await supabase
      .from('transactions')
      .select('amount, type, date, category')
      .eq('user_id', userId)
      .eq('type', 'expense');
    const allExp = (allTxns ?? []) as Array<{ amount: number; date: string; category: string | null }>;
    if (allExp.length >= 4) {
      const byMonth: Record<string, number> = {};
      allExp.forEach((t) => {
        const month = t.date.slice(0, 7);
        byMonth[month] = (byMonth[month] ?? 0) + Math.abs(Number(t.amount));
      });
      const summerMonths = ['06', '07', '08'];
      const winterMonths = ['12', '01', '02'];
      const summerAvg = Object.entries(byMonth)
        .filter(([m]) => summerMonths.includes(m.slice(5, 7)))
        .reduce((s, [, v]) => s + v, 0) / 3;
      const winterAvg = Object.entries(byMonth)
        .filter(([m]) => winterMonths.includes(m.slice(5, 7)))
        .reduce((s, [, v]) => s + v, 0) / 3;
      if (winterAvg > 0 && summerAvg > 0) utilitiesSummerVsWinter = summerAvg / winterAvg;
    }

    result.spending = {
      nextMonthBillsTotal: nextMonthTotal,
      nextMonthBillsCount: nextMonthBills.length,
      last3MonthsAvgExpenses: last3Avg,
      utilitiesSummerVsWinter,
    };
  } catch {}

  // --- Growth: from growth_records (if table exists) ---
  try {
    const { data: records } = await supabase
      .from('growth_records')
      .select('name, record_date, shoe_size, height_inches')
      .eq('user_id', userId)
      .order('record_date', { ascending: true });
    const list = (records ?? []) as Array<{ name: string; record_date: string; shoe_size: string | null; height_inches: number | null }>;
    const byName: Record<string, typeof list> = {};
    list.forEach((r) => {
      if (!byName[r.name]) byName[r.name] = [];
      byName[r.name].push(r);
    });
    Object.entries(byName).forEach(([name, recs]) => {
      if (recs.length < 2) return;
      const withShoe = recs.map((r) => ({ date: r.record_date, num: parseShoeSize(r.shoe_size), height: r.height_inches })).filter((r) => r.num != null);
      if (withShoe.length < 2) return;
      const first = withShoe[0];
      const last = withShoe[withShoe.length - 1];
      const monthsBetween = differenceInMonths(parseISO(last.date), parseISO(first.date));
      if (monthsBetween <= 0) return;
      const sizeDiff = last.num! - first.num!;
      const monthsPerSize = sizeDiff !== 0 ? monthsBetween / sizeDiff : 12;
      const nextSize = Math.ceil(last.num! + 0.5);
      const monthsUntil = Math.round(monthsPerSize * 0.5);
      result.growth.push({
        name,
        nextShoeSize: String(nextSize),
        monthsUntilNextSize: monthsUntil,
        lastHeight: last.height ?? undefined,
        lastRecordDate: last.date,
        growthNote: last.height != null ? `Last recorded ${last.height}" on ${format(parseISO(last.date), 'MMM d')}` : undefined,
      });
    });
  } catch {}

  // --- Maintenance: vehicles with oil change data ---
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, year, make, model, current_mileage, last_oil_change_mileage, last_oil_change_date, oil_change_interval_miles')
      .eq('user_id', userId);
    const vList = (vehicles ?? []) as Array<{
      id: string;
      year: number | null;
      make: string | null;
      model: string | null;
      current_mileage?: number | null;
      last_oil_change_mileage?: number | null;
      last_oil_change_date?: string | null;
      oil_change_interval_miles?: number | null;
    }>;
    vList.forEach((v) => {
      const label = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
      const interval = v.oil_change_interval_miles ?? 5000;
      let message = '';
      let milesUntil: number | undefined;
      let dateEstimate: string | undefined;

      if (v.current_mileage != null && v.last_oil_change_mileage != null) {
        const nextChangeAt = v.last_oil_change_mileage + interval;
        milesUntil = Math.max(0, nextChangeAt - v.current_mileage);
        message = milesUntil <= 500 ? `Oil change due in ~${milesUntil} miles` : `Next oil change in ~${milesUntil} miles`;
        if (milesUntil <= 500) dateEstimate = 'soon';
      } else if (v.last_oil_change_date) {
        const nextDate = addMonths(parseISO(v.last_oil_change_date), 6);
        dateEstimate = format(nextDate, 'MMM d, yyyy');
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        message = daysUntil <= 30 ? `Oil change due around ${dateEstimate}` : `Based on your driving, next oil change around ${dateEstimate}`;
      }
      if (message) result.maintenance.push({ vehicleId: v.id, vehicleLabel: label, milesUntilOilChange: milesUntil, oilChangeDateEstimate: dateEstimate, message });
    });
  } catch {}

  // --- Health: appointments + medical for dental / physical ---
  try {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, title, appointment_date')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false })
      .limit(100);
    const appts = (appointments ?? []) as Array<{ title: string; appointment_date: string }>;
    const dentalTitles = appts.filter((a) => /dental|dentist|teeth/i.test(a.title));
    const physicalTitles = appts.filter((a) => /physical|annual|checkup|wellness/i.test(a.title));

    dentalTitles.slice(0, 5).forEach((a) => {
      const monthsSince = differenceInMonths(now, parseISO(a.appointment_date));
      if (monthsSince >= 6) {
        const person = a.title.split(/-|–|:/)[0]?.trim() || undefined;
        result.health.push({
          type: 'dental',
          person,
          monthsSince,
          lastDate: a.appointment_date,
          message: `It's been ${monthsSince} months since ${person ? person + "'s" : 'your'} last dental checkup.`,
        });
      }
    });

    physicalTitles.slice(0, 5).forEach((a) => {
      const monthsSince = differenceInMonths(now, parseISO(a.appointment_date));
      if (monthsSince >= 10) {
        const person = a.title.split(/-|–|:/)[0]?.trim() || undefined;
        result.health.push({
          type: 'physical',
          person,
          monthsSince,
          lastDate: a.appointment_date,
          message: `Annual physical coming up${person ? ` for ${person}` : ''} — last was ${monthsSince} months ago.`,
        });
      }
    });

    const { data: medical } = await supabase
      .from('medical_records')
      .select('record_type, record_date')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .limit(30);
    const medList = (medical ?? []) as Array<{ record_type: string | null; record_date: string | null }>;
    const dentalRecords = medList.filter((m) => m.record_type && /dental|dentist/i.test(m.record_type));
    if (dentalRecords.length > 0 && result.health.filter((h) => h.type === 'dental').length === 0) {
      const last = dentalRecords[0];
      if (last.record_date) {
        const monthsSince = differenceInMonths(now, parseISO(last.record_date));
        if (monthsSince >= 6) result.health.push({ type: 'dental', monthsSince, lastDate: last.record_date, message: `It's been ${monthsSince} months since last dental record.` });
      }
    }
  } catch {}

  return result;
}
