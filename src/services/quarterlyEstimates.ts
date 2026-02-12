import type { Transaction } from '../types/transactions';
import { EXPENSE_CATEGORIES } from '../lib/categories';

const MEALS_DEDUCTIBLE_RATE = 0.5;

export type QuarterRange = {
  start: string;
  end: string;
  due: string;
};

export function getQuarterRanges(year: number): Record<1 | 2 | 3 | 4, QuarterRange> {
  return {
    1: { start: `${year}-01-01`, end: `${year}-03-31`, due: `${year}-04-15` },
    2: { start: `${year}-04-01`, end: `${year}-06-30`, due: `${year}-06-15` },
    3: { start: `${year}-07-01`, end: `${year}-09-30`, due: `${year}-09-15` },
    4: { start: `${year}-10-01`, end: `${year}-12-31`, due: `${year + 1}-01-15` },
  };
}

export type TaxSettings = {
  effective_tax_rate: number;
  state_estimated_tax_rate: number;
  include_meals_50: boolean;
  include_mileage: boolean;
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  effective_tax_rate: 0.25,
  state_estimated_tax_rate: 0,
  include_meals_50: true,
  include_mileage: true,
};

function filterByDateRange(transactions: Transaction[], start: string, end: string): Transaction[] {
  return transactions.filter((t) => {
    const d = t.date?.split('T')[0] ?? '';
    return d >= start && d <= end;
  });
}

function computeDeductibleExpenses(
  transactions: Transaction[],
  includeMeals50: boolean
): { deductible: number; income: number; expenses: number } {
  let income = 0;
  let expenses = 0;
  let deductible = 0;

  for (const t of transactions) {
    const amt = Number(t.amount);
    const absAmt = Math.abs(amt);

    if (t.type === 'income') {
      income += amt;
      continue;
    }

    if (t.type === 'expense') {
      expenses += absAmt;
      if (!t.tax_deductible) continue;

      const cat = t.category ?? 'other';
      const rate = includeMeals50 && cat === 'meals' ? MEALS_DEDUCTIBLE_RATE : 1;
      deductible += absAmt * rate;
    }
  }

  return { deductible, income, expenses };
}

export type QuarterEstimateResult = {
  taxableProfit: number;
  fedEstimate: number;
  stateEstimate: number;
  totalEstimate: number;
  income: number;
  expenses: number;
  deductibleTotals: number;
  txCount: number;
};

export function computeQuarterlyEstimate(params: {
  transactions: Transaction[];
  year: number;
  quarter: 1 | 2 | 3 | 4;
  settings: TaxSettings;
}): QuarterEstimateResult {
  const { transactions, year, quarter, settings } = params;
  const range = getQuarterRanges(year)[quarter];
  const quarterTxns = filterByDateRange(transactions, range.start, range.end);

  const { deductible, income, expenses } = computeDeductibleExpenses(
    quarterTxns,
    settings.include_meals_50
  );

  const profit = income - expenses;
  const taxableProfit = Math.max(profit, 0);
  const fedEstimate = taxableProfit * settings.effective_tax_rate;
  const stateEstimate = taxableProfit * (settings.state_estimated_tax_rate ?? 0);
  const totalEstimate = fedEstimate + stateEstimate;

  return {
    taxableProfit,
    fedEstimate,
    stateEstimate,
    totalEstimate,
    income,
    expenses,
    deductibleTotals: deductible,
    txCount: quarterTxns.length,
  };
}

export type EstimatedTaxPaymentRow = {
  id: string;
  user_id: string;
  tax_year: number;
  quarter: number;
  due_date: string;
  estimated_amount: number;
  state_estimated_amount: number;
  total_estimated: number;
  paid: boolean;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  confirmation_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function getQuarterDueDate(year: number, quarter: 1 | 2 | 3 | 4): string {
  return getQuarterRanges(year)[quarter].due;
}
