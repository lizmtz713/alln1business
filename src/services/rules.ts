import type { CategoryRule, CategoryRuleInsert } from '../types/categoryRules';

export type RuleMatchInput = {
  vendor?: string | null;
  description?: string | null;
  type?: 'income' | 'expense';
};

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function applyCategoryRules(
  input: RuleMatchInput,
  rules: CategoryRule[]
): { category: string | null; matchedRuleId: string | null } {
  const activeRules = rules.filter((r) => r.is_active);
  if (activeRules.length === 0) return { category: null, matchedRuleId: null };

  const txType = input.type ?? 'expense';
  const vendorNorm = input.vendor ? normalize(input.vendor) : '';
  const descNorm = input.description ? normalize(input.description) : '';

  const applies = (r: CategoryRule): boolean => {
    if (r.applies_to === 'both') return true;
    if (r.applies_to === 'expense') return txType === 'expense';
    if (r.applies_to === 'income') return txType === 'income';
    return false;
  };

  const byPriority = [...activeRules]
    .filter(applies)
    .sort((a, b) => a.priority - b.priority || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  for (const r of byPriority) {
    const valNorm = normalize(r.match_value);
    if (r.match_type === 'vendor_exact' && vendorNorm && valNorm && vendorNorm === valNorm) {
      return { category: r.category, matchedRuleId: r.id };
    }
    if (r.match_type === 'vendor_contains' && vendorNorm && valNorm && vendorNorm.includes(valNorm)) {
      return { category: r.category, matchedRuleId: r.id };
    }
    if (r.match_type === 'description_contains' && descNorm && valNorm && descNorm.includes(valNorm)) {
      return { category: r.category, matchedRuleId: r.id };
    }
  }
  return { category: null, matchedRuleId: null };
}

export function buildSuggestedRuleFromEdit(params: {
  oldCategory?: string | null;
  newCategory: string;
  vendor?: string | null;
  description?: string | null;
  type: 'income' | 'expense';
}): Omit<CategoryRuleInsert, 'user_id'> | null {
  if (!params.newCategory?.trim()) return null;

  const appliesTo = params.type;
  const base = {
    category: params.newCategory,
    applies_to: appliesTo,
    confidence_source: 'user' as const,
    priority: 100,
    is_active: true,
  };

  if (params.vendor?.trim()) {
    const matchValue = params.vendor.trim();
    return {
      match_type: 'vendor_exact',
      match_value: matchValue,
      ...base,
    };
  }
  if (params.description?.trim()) {
    const matchValue = params.description.trim().slice(0, 100);
    return {
      match_type: 'description_contains',
      match_value: matchValue,
      ...base,
    };
  }
  return null;
}
