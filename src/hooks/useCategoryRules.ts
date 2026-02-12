import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type {
  CategoryRule,
  CategoryRuleInsert,
  CategoryRuleUpdate,
} from '../types/categoryRules';

const QUERY_KEY = 'category-rules';

export function useCategoryRules() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('category_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        if (String(error.code) === '42P01') return []; // table does not exist
        throw new Error(error.message ?? 'Failed to load rules');
      }
      return (data ?? []) as CategoryRule[];
    },
    enabled: Boolean(userId),
  });
}

export function useActiveCategoryRules() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'active'],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('category_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        if (String(error.code) === '42P01') return []; // table does not exist
        throw new Error(error.message ?? 'Failed to load rules');
      }
      return (data ?? []) as CategoryRule[];
    },
    enabled: Boolean(userId),
  });
}

export function useCreateCategoryRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: async (input: Omit<CategoryRuleInsert, 'user_id'>) => {
      if (!userId) throw new Error('Must be signed in');
      const row: CategoryRuleInsert = { ...input, user_id: userId };

      const { data: existing } = await supabase
        .from('category_rules')
        .select('id')
        .eq('user_id', userId)
        .eq('match_type', row.match_type)
        .ilike('match_value', row.match_value)
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabase
          .from('category_rules')
          .update({
            category: row.category,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (existing as { id: string }).id)
          .select()
          .single();
        if (error) throw new Error(error.message ?? 'Failed to update rule');
        return updated as CategoryRule;
      }

      const { data, error } = await supabase
        .from('category_rules')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to create rule');
      return data as CategoryRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateCategoryRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CategoryRuleUpdate }) => {
      if (!user?.id) throw new Error('Must be signed in');
      const { data, error } = await supabase
        .from('category_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update rule');
      return data as CategoryRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteCategoryRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Must be signed in');
      const { error } = await supabase
        .from('category_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
