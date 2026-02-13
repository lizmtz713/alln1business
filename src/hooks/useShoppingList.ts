import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';

const QUERY_KEY = 'shoppingList';

export function useShoppingList() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
      if (error) throw new Error(error.message ?? 'Failed to load shopping list');
      return (data ?? []) as Array<{ id: string; user_id: string; item: string; completed: boolean; added_at: string }>;
    },
    enabled: Boolean(userId),
  });
}

export function useAddShoppingItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const trimmed = item.trim();
      if (!trimmed) throw new Error('Item cannot be empty');
      const { data, error } = await supabase
        .from('shopping_list')
        .insert({ user_id: user.id, item: trimmed })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to add item');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useToggleShoppingItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase
        .from('shopping_list')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to update');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
