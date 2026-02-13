import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import type {
  InventoryItem,
  InventoryWalkthrough,
  InventoryItemInsert,
  InventoryItemUpdate,
} from '../types/inventory';

const WALKTHROUGH_KEY = 'inventoryWalkthroughs';
const ITEMS_KEY = 'inventoryItems';

export function useInventoryWalkthroughs() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [WALKTHROUGH_KEY, userId],
    queryFn: async (): Promise<InventoryWalkthrough[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      const { data, error } = await supabase
        .from('inventory_walkthroughs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as InventoryWalkthrough[];
    },
    enabled: Boolean(userId),
  });
}

export function useInventoryItems(walkthroughId: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [ITEMS_KEY, userId, walkthroughId],
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      let q = supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (walkthroughId) q = q.eq('walkthrough_id', walkthroughId);
      else q = q.is('walkthrough_id', null);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []) as InventoryItem[];
    },
    enabled: Boolean(userId),
  });
}

export function useAllInventoryItems() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [ITEMS_KEY, userId, 'all'],
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) return [];
      return (data ?? []) as InventoryItem[];
    },
    enabled: Boolean(userId),
  });
}

export function useCreateWalkthrough() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name?: string) => {
      if (!user?.id || !hasSupabaseConfig) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('inventory_walkthroughs')
        .insert({ user_id: user.id, name: name ?? null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as InventoryWalkthrough;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_KEY, user?.id] });
    },
  });
}

export function useAddInventoryItem(walkthroughId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItemInsert, 'user_id' | 'walkthrough_id'>) => {
      if (!user?.id || !hasSupabaseConfig) throw new Error('Not signed in');
      const insert: InventoryItemInsert = {
        ...item,
        user_id: user.id,
        walkthrough_id: walkthroughId,
        value: item.value ?? 0,
      };
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insert)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as InventoryItem;
    },
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, walkthroughId] });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, 'all'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      walkthroughId,
      update,
    }: {
      id: string;
      walkthroughId: string | null;
      update: InventoryItemUpdate;
    }) => {
      if (!user?.id || !hasSupabaseConfig) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as InventoryItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ITEMS_KEY, user?.id, variables.walkthroughId],
      });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, 'all'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      walkthroughId,
    }: {
      id: string;
      walkthroughId: string | null;
    }) => {
      if (!user?.id || !hasSupabaseConfig) throw new Error('Not signed in');
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ITEMS_KEY, user?.id, variables.walkthroughId],
      });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, 'all'] });
    },
  });
}

export function useBulkAddInventoryItems(walkthroughId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      payload:
        | Omit<InventoryItemInsert, 'user_id' | 'walkthrough_id'>[]
        | { items: Omit<InventoryItemInsert, 'user_id' | 'walkthrough_id'>[]; walkthroughId?: string }
    ): Promise<InventoryItem[]> => {
      if (!user?.id || !hasSupabaseConfig) throw new Error('Not signed in');
      const { items: list, walkthroughId: override } = Array.isArray(payload)
        ? { items: payload, walkthroughId: undefined }
        : { items: payload.items, walkthroughId: payload.walkthroughId };
      if (list.length === 0) return [];
      const wid = override ?? walkthroughId;
      const rows = list.map((item, i) => ({
        user_id: user.id,
        walkthrough_id: wid,
        room: item.room,
        item_name: item.item_name,
        brand: item.brand ?? null,
        purchase_year: item.purchase_year ?? null,
        value: item.value ?? 0,
        category: item.category ?? null,
        photo_url: item.photo_url ?? null,
        notes: item.notes ?? null,
        sort_order: i,
      }));
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(rows)
        .select();
      if (error) throw new Error(error.message);
      return (data ?? []) as InventoryItem[];
    },
    onSuccess: (_, variables) => {
      const wid = Array.isArray(variables)
        ? walkthroughId
        : (variables as { walkthroughId?: string }).walkthroughId ?? walkthroughId;
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, wid] });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, user?.id, 'all'] });
    },
  });
}
