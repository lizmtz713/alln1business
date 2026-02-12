import type { Transaction } from '../types/transactions';
import type { TaxPeriod, TaxSummary, TaxCategorySummary, TaxWarning } from '../types/tax';
import { getCategoryName } from '../lib/categories';
import { EXPENSE_CATEGORIES } from '../lib/categories';

const MEALS_DEDUCTIBLE_RATE = 0.5;

export function getDefaultPeriods(year: number): TaxPeriod[] {
  const periods: TaxPeriod[] = [];
  const now = new Date();
  const y = year;
  const today = `${y}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const jan1 = `${y}-01-01`;
  const dec31 = `${y}-12-31`;

  const endOfLastMonth = new Date(y, now.getMonth(), 0);
  const startOfLastMonth = new Date(y, now.getMonth() - 1, 1);
  const lastMonthStart = `${startOfLastMonth.getFullYear()}-${String(startOfLastMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const lastMonthEnd = `${endOfLastMonth.getFullYear()}-${String(endOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfLastMonth.getDate()).padStart(2, '0')}`;

  const thisMonthStart = `${y}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  periods.push({ start: jan1, end: today, label: 'YTD' });
  periods.push({ start: thisMonthStart, end: today, label: 'This Month' });
  periods.push({ start: lastMonthStart, end: lastMonthEnd, label: 'Last Month' });
  periods.push({ start: `${y}-01-01`, end: `${y}-03-31`, label: 'Q1' });
  periods.push({ start: `${y}-04-01`, end: `${y}-06-30`, label: 'Q2' });
  periods.push({ start: `${y}-07-01`, end: `${y}-09-30`, label: 'Q3' });
  periods.push({ start: `${y}-10-01`, end: `${y}-12-31`, label: 'Q4' });
  periods.push({ start: jan1, end: dec31, label: 'Full Year' });
  periods.push({ start: '', end: '', label: 'Custom' });

  return periods;
}

type CategoryInfo = { id: string; name: string; isTaxDeductible: boolean };

export function computeTaxSummary(params: {
  year: number;
  start: string;
  end: string;
  transactions: Transaction[];
  categories?: CategoryInfo[];
}): TaxSummary {
  const { start, end, transactions } = params;
  const catMap = (params.categories ?? EXPENSE_CATEGORIES.map((c) => ({ id: c.id, name: c.name, isTaxDeductible: true })))
    .reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, CategoryInfo>);

  const period: TaxPeriod = {
    start,
    end,
    label: start && end ? `${start} to ${end}` : 'Custom',
  };

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalDeductible = 0;
  let totalWithReceipt = 0;
  let totalDeductibleAmount = 0;
  let uncategorizedExpense = 0;
  let mealsDeductible = 0;
  let mealsTotal = 0;

  const byCat: Record<string, { deductible: number; total: number; count: number }> = {};

  for (const t of transactions) {
    const amt = Number(t.amount);
    const absAmt = Math.abs(amt);

    if (t.type === 'income') {
      totalIncome += amt;
      continue;
    }

    if (t.type === 'expense') {
      totalExpenses += absAmt;
      const cat = t.category ?? 'other';
      const catInfo = catMap[cat] ?? { id: cat, name: getCategoryName(cat), isTaxDeductible: true };

      if (!byCat[cat]) byCat[cat] = { deductible: 0, total: 0, count: 0 };
      byCat[cat].total += absAmt;
      byCat[cat].count += 1;

      if (cat === 'other' || !t.category) {
        uncategorizedExpense += absAmt;
      }

      if (!t.tax_deductible || !catInfo.isTaxDeductible) continue;

      const rate = cat === 'meals' ? MEALS_DEDUCTIBLE_RATE : 1;
      const deductible = absAmt * rate;
      byCat[cat].deductible += deductible;
      totalDeductible += deductible;
      totalDeductibleAmount += absAmt;

      if (t.receipt_url) totalWithReceipt += deductible;
      if (cat === 'meals') {
        mealsTotal += absAmt;
        mealsDeductible += deductible;
      }
    }
  }

  const byCategory: TaxCategorySummary[] = Object.entries(byCat)
    .filter(([, v]) => v.deductible > 0)
    .map(([cat, v]) => ({
      category: cat,
      name: getCategoryName(cat),
      deductibleAmount: v.deductible,
      totalAmount: v.total,
      txCount: v.count,
    }))
    .sort((a, b) => b.deductibleAmount - a.deductibleAmount);

  const warnings: TaxWarning[] = [];

  if (transactions.length === 0) {
    warnings.push({
      title: 'No transactions in period',
      body: 'Import your bank statement to get started.',
      severity: 'action',
      ctaLabel: 'Upload Statement',
      ctaRoute: '/(modals)/upload-statement',
    });
  } else {
    if (totalDeductible === 0 && totalExpenses > 0) {
      warnings.push({
        title: 'No deductible expenses yet',
        body: 'Mark expenses as tax deductible when adding or editing.',
        severity: 'tip',
        ctaLabel: 'Review Transactions',
        ctaRoute: '/(tabs)/transactions',
      });
    }
    if (totalDeductible > 0 && mealsDeductible > totalDeductible * 0.15) {
      warnings.push({
        title: 'High meals spend',
        body: 'Meals are only 50% deductible. Consider if all qualify for business deduction.',
        severity: 'warning',
      });
    }
    if (totalDeductible > 0 && totalWithReceipt < totalDeductible * 0.8) {
      warnings.push({
        title: 'Missing receipts',
        body: `Over 20% of deductible expenses have no receipt. Attach receipts for audit protection.`,
        severity: 'warning',
        ctaLabel: 'Review Transactions',
        ctaRoute: '/(tabs)/transactions',
      });
    }
    if (totalExpenses > 0 && uncategorizedExpense > totalExpenses * 0.1) {
      warnings.push({
        title: 'Uncategorized spend',
        body: 'Categorize expenses for accurate tax reporting.',
        severity: 'tip',
        ctaLabel: 'Review Transactions',
        ctaRoute: '/(tabs)/transactions',
      });
    }
  }

  return {
    period,
    totalIncome,
    totalExpenses,
    totalDeductible,
    byCategory,
    warnings,
  };
}
