import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import type {
  Invoice,
  InvoiceWithCustomer,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceItem,
  InvoiceItemInsert,
  InvoiceStatus,
} from '../types/invoices';

const QUERY_KEY = 'invoices';

export function useInvoices(params?: { status?: InvoiceStatus; search?: string }) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, params?.status, params?.search],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('invoices')
        .select(
          `
          *,
          customers (
            company_name,
            contact_name,
            email,
            address,
            city,
            state,
            zip
          )
        `
        )
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (params?.status) q = q.eq('status', params.status);
      const { data, error } = await q;
      if (error) throw new Error(error.message ?? 'Failed to load invoices');
      let list = (data ?? []) as InvoiceWithCustomer[];
      if (params?.search?.trim()) {
        const term = params.search.trim().toLowerCase();
        list = list.filter(
          (inv) =>
            inv.invoice_number?.toLowerCase().includes(term) ||
            (inv.customers as { company_name?: string; contact_name?: string } | null)?.company_name?.toLowerCase().includes(term) ||
            (inv.customers as { contact_name?: string } | null)?.contact_name?.toLowerCase().includes(term)
        );
      }
      return list;
    },
    enabled: Boolean(userId),
  });
}

export type InvoiceDetail = Invoice & {
  customers: {
    company_name: string | null;
    contact_name: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
  invoice_items: InvoiceItem[];
};

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select(
          `
          *,
          customers (
            company_name,
            contact_name,
            email,
            address,
            city,
            state,
            zip
          )
        `
        )
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (invError || !invData) return null;

      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('sort_order', { ascending: true });

      if (itemsError) throw new Error(itemsError.message);

      return {
        ...invData,
        customers: (invData as InvoiceWithCustomer).customers ?? null,
        invoice_items: (itemsData ?? []) as InvoiceItem[],
      } as InvoiceDetail;
    },
    enabled: Boolean(userId && id),
  });
}

export async function getNextInvoiceNumber(userId: string): Promise<string> {
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return `INV-${Date.now().toString().slice(-6)}`;
  const next = (count ?? 0) + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export function useCreateInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      invoice: Omit<InvoiceInsert, 'user_id'> & { invoice_number?: string };
      items: Omit<InvoiceItemInsert, 'invoice_id'>[];
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const nextNum = await getNextInvoiceNumber(user.id);
      const inv: InvoiceInsert = {
        ...input.invoice,
        user_id: user.id,
        invoice_number: (input.invoice.invoice_number && input.invoice.invoice_number !== 'AUTO') ? input.invoice.invoice_number : nextNum,
      };

      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert(inv)
        .select()
        .single();
      if (invError) throw new Error(invError.message ?? 'Failed to create invoice');
      const invoiceId = (invData as Invoice).id;

      if (input.items.length > 0) {
        const itemsToInsert: InvoiceItemInsert[] = input.items.map((item, i) => ({
          ...item,
          invoice_id: invoiceId,
          sort_order: item.sort_order ?? i,
        }));
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);
        if (itemsError) throw new Error(itemsError.message ?? 'Failed to create items');
      }

      return { invoice: invData as Invoice, id: invoiceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InvoiceUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update invoice');
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpsertInvoiceItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      items,
    }: {
      invoiceId: string;
      items: Omit<InvoiceItemInsert, 'invoice_id'>[];
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const { error: delError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      if (delError) throw new Error(delError.message ?? 'Failed to clear items');

      if (items.length > 0) {
        const toInsert: InvoiceItemInsert[] = items.map((item, i) => ({
          ...item,
          invoice_id: invoiceId,
          sort_order: item.sort_order ?? i,
        }));
        const { error: insError } = await supabase
          .from('invoice_items')
          .insert(toInsert);
        if (insError) throw new Error(insError.message ?? 'Failed to insert items');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete invoice');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  date: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
};

export function useRecordInvoicePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      if (!user?.id) throw new Error('You must be signed in');

      const { data: inv, error: fetchErr } = await supabase
        .from('invoices')
        .select('amount_paid, total, balance_due')
        .eq('id', input.invoiceId)
        .eq('user_id', user.id)
        .single();

      if (fetchErr || !inv) throw new Error('Invoice not found');

      const currentPaid = Number(inv.amount_paid ?? 0);
      const newPaid = currentPaid + input.amount;
      const total = Number(inv.total ?? 0);
      const balanceDue = Math.max(0, total - newPaid);
      const isFullyPaid = balanceDue < 0.01;

      const updates: InvoiceUpdate = {
        amount_paid: newPaid,
        balance_due: balanceDue,
        updated_at: new Date().toISOString(),
      };
      if (isFullyPaid) {
        updates.status = 'paid';
        updates.paid_date = input.date;
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', input.invoiceId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message ?? 'Failed to record payment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useInvoiceStats() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, 'stats'],
    queryFn: async () => {
      if (!userId) return { draft: 0, sent: 0, overdue: 0, paid: 0 };
      const { data, error } = await supabase
        .from('invoices')
        .select('status')
        .eq('user_id', userId)
        .in('status', ['draft', 'sent', 'viewed', 'overdue', 'paid']);
      if (error) throw new Error(error.message);
      const list = (data ?? []) as { status: string }[];
      return {
        draft: list.filter((r) => r.status === 'draft').length,
        sent: list.filter((r) => ['sent', 'viewed'].includes(r.status)).length,
        overdue: list.filter((r) => r.status === 'overdue').length,
        paid: list.filter((r) => r.status === 'paid').length,
      };
    },
    enabled: Boolean(userId),
  });
}
