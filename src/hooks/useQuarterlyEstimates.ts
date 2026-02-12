import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../components/ui';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import { useTransactions } from './useTransactions';
import {
  getQuarterRanges,
  computeQuarterlyEstimate,
  DEFAULT_TAX_SETTINGS,
  type TaxSettings,
  type EstimatedTaxPaymentRow,
} from '../services/quarterlyEstimates';
import { normalizeError } from '../lib/errors';
import { hapticSuccess } from '../lib/haptics';

const SETTINGS_KEY = 'tax-settings';
const ESTIMATES_KEY = 'estimated-tax-payments';
const COMPLIANCE_KEY = 'compliance-items';

export function useTaxSettings() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [SETTINGS_KEY, userId],
    queryFn: async (): Promise<TaxSettings> => {
      if (!userId || !hasSupabaseConfig) return DEFAULT_TAX_SETTINGS;
      const { data, error } = await supabase
        .from('tax_settings')
        .select('effective_tax_rate, state_estimated_tax_rate, include_meals_50, include_mileage')
        .eq('user_id', userId)
        .single();
      if (error || !data) return DEFAULT_TAX_SETTINGS;
      const row = data as {
        effective_tax_rate?: number;
        state_estimated_tax_rate?: number;
        include_meals_50?: boolean;
        include_mileage?: boolean;
      };
      return {
        effective_tax_rate: Number(row.effective_tax_rate ?? 0.25),
        state_estimated_tax_rate: Number(row.state_estimated_tax_rate ?? 0),
        include_meals_50: row.include_meals_50 ?? true,
        include_mileage: row.include_mileage ?? true,
      };
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateTaxSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<TaxSettings>) => {
      if (!user?.id) throw new Error('You must be signed in');
      const payload = {
        user_id: user.id,
        tax_year: new Date().getFullYear(),
        effective_tax_rate: updates.effective_tax_rate ?? 0.25,
        state_estimated_tax_rate: updates.state_estimated_tax_rate ?? 0,
        include_meals_50: updates.include_meals_50 ?? true,
        include_mileage: updates.include_mileage ?? true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('tax_settings')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw new Error(error.message ?? 'Failed to save settings');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
      toast.show('Settings saved', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      toast.show(normalizeError(e), 'error');
    },
  });
}

export function useQuarterlyEstimates(year: number) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data: transactions = [] } = useTransactions({
    dateRange: { start: `${year}-01-01`, end: `${year}-12-31` },
  });
  const { data: settings = DEFAULT_TAX_SETTINGS } = useTaxSettings();

  const paymentsQuery = useQuery({
    queryKey: [ESTIMATES_KEY, userId, year],
    queryFn: async (): Promise<EstimatedTaxPaymentRow[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      const { data, error } = await supabase
        .from('estimated_tax_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('tax_year', year)
        .order('quarter', { ascending: true });
      if (error) throw new Error(error.message ?? 'Failed to load estimates');
      return (data ?? []) as EstimatedTaxPaymentRow[];
    },
    enabled: Boolean(userId),
  });

  const payments = paymentsQuery.data ?? [];
  const ranges = getQuarterRanges(year);

  const quarters = ([1, 2, 3, 4] as const).map((q) => {
    const range = ranges[q];
    const computed = computeQuarterlyEstimate({
      transactions,
      year,
      quarter: q,
      settings,
    });
    const row = payments.find((p) => p.quarter === q);
    return {
      quarter: q,
      ...range,
      ...computed,
      paymentRow: row ?? null,
    };
  });

  return {
    quarters,
    payments,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
}

export function useUpsertQuarterlyEstimates(year: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { quarters } = useQuarterlyEstimates(year);

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('You must be signed in');
      const ranges = getQuarterRanges(year);
      for (let q = 1; q <= 4; q++) {
        const range = ranges[q as 1 | 2 | 3 | 4];
        const quarterData = quarters.find((x) => x.quarter === q);
        const estimated_amount = quarterData?.fedEstimate ?? 0;
        const state_estimated_amount = quarterData?.stateEstimate ?? 0;
        const total_estimated = estimated_amount + state_estimated_amount;

        await supabase.from('estimated_tax_payments').upsert(
          {
            user_id: user.id,
            tax_year: year,
            quarter: q,
            due_date: range.due,
            estimated_amount,
            state_estimated_amount,
            total_estimated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,tax_year,quarter' }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ESTIMATES_KEY] });
      toast.show('Estimates updated', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      toast.show(normalizeError(e), 'error');
    },
  });
}

export function useMarkEstimatePaid() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      paid: boolean;
      paid_amount?: number;
      paid_date?: string;
      payment_method?: string;
      confirmation_number?: string;
      notes?: string;
    }) => {
      const { id, paid, paid_amount, paid_date, payment_method, confirmation_number, notes } = params;
      const payload: Record<string, unknown> = {
        paid,
        updated_at: new Date().toISOString(),
      };
      if (paid) {
        payload.paid_amount = paid_amount ?? null;
        payload.paid_date = paid_date ?? new Date().toISOString().split('T')[0];
        payload.payment_method = payment_method ?? null;
        payload.confirmation_number = confirmation_number ?? null;
        payload.notes = notes ?? null;
      } else {
        payload.paid_amount = null;
        payload.paid_date = null;
        payload.payment_method = null;
        payload.confirmation_number = null;
      }

      const { error } = await supabase
        .from('estimated_tax_payments')
        .update(payload)
        .eq('id', id);
      if (error) throw new Error(error.message ?? 'Failed to update payment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ESTIMATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPLIANCE_KEY] });
      toast.show('Payment updated', 'success');
      hapticSuccess();
    },
    onError: (e) => {
      toast.show(normalizeError(e), 'error');
    },
  });
}
