export type CategoryRuleMatchType = 'vendor_exact' | 'vendor_contains' | 'description_contains';
export type CategoryRuleAppliesTo = 'expense' | 'income' | 'both';
export type CategoryRuleConfidenceSource = 'user' | 'ai';

export type CategoryRule = {
  id: string;
  user_id: string;
  match_type: CategoryRuleMatchType;
  match_value: string;
  category: string;
  subcategory: string | null;
  applies_to: CategoryRuleAppliesTo;
  confidence_source: CategoryRuleConfidenceSource;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryRuleInsert = {
  user_id: string;
  match_type: CategoryRuleMatchType;
  match_value: string;
  category: string;
  subcategory?: string | null;
  applies_to?: CategoryRuleAppliesTo;
  confidence_source?: CategoryRuleConfidenceSource;
  priority?: number;
  is_active?: boolean;
};

export type CategoryRuleUpdate = Partial<
  Omit<CategoryRule, 'id' | 'user_id' | 'created_at'>
>;
