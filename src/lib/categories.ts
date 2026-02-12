export type CategoryItem = {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
};

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'income', name: 'Income', icon: '💰', type: 'income' },
  { id: 'sales', name: 'Sales Revenue', icon: '🛒', type: 'income' },
  { id: 'services', name: 'Service Revenue', icon: '💼', type: 'income' },
  { id: 'other_income', name: 'Other Income', icon: '💵', type: 'income' },
];

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'supplies', name: 'Supplies', icon: '📦', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', type: 'expense' },
  { id: 'meals', name: 'Meals & Entertainment', icon: '🍔', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: '💡', type: 'expense' },
  { id: 'software', name: 'Software & Subscriptions', icon: '💻', type: 'expense' },
  { id: 'contractors', name: 'Contractors', icon: '👷', type: 'expense' },
  { id: 'marketing', name: 'Marketing & Advertising', icon: '📣', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', type: 'expense' },
  { id: 'rent', name: 'Rent & Lease', icon: '🏢', type: 'expense' },
  { id: 'equipment', name: 'Equipment', icon: '🔧', type: 'expense' },
  { id: 'professional', name: 'Professional Services', icon: '👔', type: 'expense' },
  { id: 'taxes', name: 'Taxes & Licenses', icon: '📋', type: 'expense' },
  { id: 'payroll', name: 'Payroll', icon: '👥', type: 'expense' },
  { id: 'shipping', name: 'Shipping & Freight', icon: '📦', type: 'expense' },
  { id: 'vehicle', name: 'Vehicle Expenses', icon: '🚗', type: 'expense' },
  { id: 'office', name: 'Office Expenses', icon: '🏠', type: 'expense' },
  { id: 'bank_fees', name: 'Bank & Merchant Fees', icon: '🏦', type: 'expense' },
  { id: 'other', name: 'Other', icon: '📋', type: 'expense' },
];

export const CATEGORIES_BY_ID: Record<string, CategoryItem> = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
].reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

export function getCategoryName(id: string | null): string {
  if (!id) return 'Uncategorized';
  return CATEGORIES_BY_ID[id]?.name ?? id;
}
