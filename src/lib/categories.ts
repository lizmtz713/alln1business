export type CategoryItem = {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
};

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'income', name: 'Income', icon: '💰', type: 'income' },
  { id: 'salary', name: 'Salary', icon: '💼', type: 'income' },
  { id: 'other_income', name: 'Other Income', icon: '💵', type: 'income' },
];

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'groceries', name: 'Groceries', icon: '🛒', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: '💡', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', type: 'expense' },
  { id: 'home_maintenance', name: 'Home Maintenance', icon: '🔧', type: 'expense' },
  { id: 'pet_care', name: 'Pet Care', icon: '🐾', type: 'expense' },
  { id: 'childcare', name: 'Childcare', icon: '👶', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', type: 'expense' },
  { id: 'meals', name: 'Meals & Entertainment', icon: '🍔', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', type: 'expense' },
  { id: 'rent', name: 'Rent & Mortgage', icon: '🏠', type: 'expense' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', type: 'expense' },
  { id: 'supplies', name: 'Supplies', icon: '📦', type: 'expense' },
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
