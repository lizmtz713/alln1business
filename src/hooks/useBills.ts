import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type {
  Bill,
  BillWithVendor,
  BillInsert,
  BillUpdate,
  BillStatus,
} from '../types/bills';
import { format, parseISO, addDays, isBefore, isAfter } from 'date-fns';

const QUERY_KEY = 'bills';
const TODAY = format(new Date(), 'yyyy-MM-dd');

function isOverdue(bill: Bill): boolean {
  return bill.status === 'pending' && bill.due_date < TODAY;
}

function isDueSoon(bill: Bill, days = 7): boolean {
  if (bill.status !== 'pending' || !bill.due_date) return false;
  try {
    const due = parseISO(bill.due_date);
    const today = new Date();
    const future = addDays(today, days);
    return !isBefore(due, today) && !isAfter(due, future);
  } catch {
    return false;
  }
}

export function useBills(params?: {
  status?: BillStatus;
  search?: string;
  due?: 'due_soon' | 'overdue' | 'all';
}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, params?.status, params?.search, params?.due],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });
      if (params?.status) q = q.eq('status', params.status);
      const { data, error } = await q;
      if (error) {
        if (/relation.*does not exist|42P01/i.test(error.message ?? '')) return [];
        throw new Error(error.message ?? 'Failed to load bills');
      }
      let list = (data ?? []) as BillWithVendor[];
      if (params?.search?.trim()) {
        const term = params.search.trim().toLowerCase();
        list = list.filter(
          (b) =>
            b.bill_name?.toLowerCase().includes(term) ||
            (b.provider_name ?? '').toLowerCase().includes(term)
        );
      }
      if (params?.due === 'overdue') list = list.filter(isOverdue);
      else if (params?.due === 'due_soon') list = list.filter((b) => isDueSoon(b));
      return list;
    },
    enabled: Boolean(userId),
  });
}

export function useBill(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase
        .from('bills')
        .select(
          `
          *,
          vendors (
            company_name,
            contact_name,
            email,
            phone
          )
        `
        )
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data ?? null) as (BillWithVendor & { vendors?: { email?: string; phone?: string } | null }) | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useCreateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<BillInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('bills')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to create bill');
      return data as Bill;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BillUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('bills')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update bill');
      return data as Bill;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase
        .from('bills')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete bill');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useMarkBillPaid() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      paid_amount?: number;
      paid_date?: string;
      payment_method?: string | null;
      confirmation_number?: string | null;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data: bill } = await supabase
        .from('bills')
        .select('amount')
        .eq('id', input.id)
        .eq('user_id', user.id)
        .single();
      if (!bill) throw new Error('Bill not found');
      const paidAmount = input.paid_amount ?? Number(bill.amount);
      const paidDate = input.paid_date ?? format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase
        .from('bills')
        .update({
          status: 'paid',
          paid_date: paidDate,
          paid_amount: paidAmount,
          payment_method: input.payment_method ?? null,
          confirmation_number: input.confirmation_number ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to mark bill paid');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpcomingBills(days = 30) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'upcoming', days],
    queryFn: async () => {
      if (!userId) return [];
      const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bills')
        .select('*, vendors(company_name, contact_name)')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('due_date', TODAY)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true });
      if (error) throw new Error(error.message ?? 'Failed to load upcoming bills');
      return (data ?? []) as BillWithVendor[];
    },
    enabled: Boolean(userId),
  });
}

export function useBillStats() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'stats'],
    queryFn: async () => {
      if (!userId) return { due_soon: 0, overdue: 0, paid: 0 };
      const { data, error } = await supabase
        .from('bills')
        .select('status, due_date')
        .eq('user_id', userId)
        .in('status', ['pending', 'paid']);
      if (error) throw new Error(error.message);
      const list = (data ?? []) as { status: string; due_date: string }[];
      const pending = list.filter((b) => b.status === 'pending');
      const dueSoon = pending.filter((b) => isDueSoon({ ...b, status: 'pending' } as Bill));
      const overdue = pending.filter((b) => isOverdue({ ...b, status: 'pending' } as Bill));
      const paid = list.filter((b) => b.status === 'paid').length;
      return {
        due_soon: dueSoon.length,
        overdue: overdue.length,
        paid,
      };
    },
    enabled: Boolean(userId),
  });
}

export { isOverdue, isDueSoon };
