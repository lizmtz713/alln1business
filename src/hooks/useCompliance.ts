import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../components/ui';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import { normalizeError } from '../lib/errors';
import { hapticSuccess } from '../lib/haptics';

export type ComplianceItem = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  recurrence: string | null;
  status: string;
  completed_date: string | null;
  reminder_days: number | null;
  notes: string | null;
  document_id: string | null;
  source: string | null;
  related_estimate_id: string | null;
  created_at: string;
};

const QUERY_KEY = 'compliance-items';

export function useComplianceItems(filters?: { upcoming?: boolean }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, userId, filters],
    queryFn: async (): Promise<ComplianceItem[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      let q = supabase
        .from('compliance_items')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.upcoming) {
        const today = new Date().toISOString().split('T')[0];
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const futureStr = future.toISOString().split('T')[0];
        q = q.gte('due_date', today).lte('due_date', futureStr);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message ?? 'Failed to load compliance');
      return (data ?? []) as ComplianceItem[];
    },
    enabled: Boolean(userId),
  });
}

export function useCreateComplianceItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (item: {
      name: string;
      description?: string | null;
      category?: string | null;
      due_date?: string | null;
      recurrence?: string | null;
      reminder_days?: number;
      notes?: string | null;
      source?: string;
      related_estimate_id?: string | null;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('compliance_items')
        .insert({
          user_id: user.id,
          name: item.name,
          description: item.description ?? null,
          category: item.category ?? null,
          due_date: item.due_date ?? null,
          recurrence: item.recurrence ?? 'once',
          reminder_days: item.reminder_days ?? 7,
          notes: item.notes ?? null,
          source: item.source ?? 'manual',
          related_estimate_id: item.related_estimate_id ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to create');
      return data as ComplianceItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.show('Reminder added', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      toast.show(normalizeError(e), 'error');
    },
  });
}

export function useUpdateComplianceItem() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ComplianceItem, 'status' | 'completed_date' | 'notes'>>;
    }) => {
      const { error } = await supabase
        .from('compliance_items')
        .update(updates as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message ?? 'Failed to update');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.show('Updated', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      toast.show(normalizeError(e), 'error');
    },
  });
}
