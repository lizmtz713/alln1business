export type TaxPeriod = {
  start: string;
  end: string;
  label: string;
};

export type TaxCategorySummary = {
  category: string;
  name: string;
  deductibleAmount: number;
  totalAmount: number;
  txCount: number;
};

export type TaxWarning = {
  title: string;
  body: string;
  severity: 'tip' | 'warning' | 'action';
  ctaLabel?: string;
  ctaRoute?: string;
};

export type TaxSummary = {
  period: TaxPeriod;
  totalIncome: number;
  totalExpenses: number;
  totalDeductible: number;
  byCategory: TaxCategorySummary[];
  warnings: TaxWarning[];
};
