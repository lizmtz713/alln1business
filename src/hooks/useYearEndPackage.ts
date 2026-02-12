import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import { exportTaxCsv } from '../services/export';
import { createTaxSummaryPdf } from '../services/taxReportPdf';
import { exportDocumentsIndexCsv } from '../services/documentsIndexExport';
import { computeTaxSummary } from '../services/tax';
import { getCpaNotes, hasOpenAIKey } from '../services/openai';
import * as Sharing from 'expo-sharing';
import type { Transaction } from '../types/transactions';
import type { Document } from '../types/documents';
import type { TaxSummary } from '../types/tax';

export type PackageFile = {
  uri: string;
  filename: string;
  mimeType: string;
};

const QUERY_KEY = 'year-end-package';

function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function useYearEndPackage(params: { year: number }) {
  const { user, profile } = useAuth();
  const userId = user?.id ?? '';
  const { year } = params;
  const { start, end } = getYearRange(year);

  const transactionsQuery = useQuery({
    queryKey: [QUERY_KEY, 'transactions', userId, year],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message ?? 'Failed to load transactions');
      return (data ?? []) as Transaction[];
    },
    enabled: Boolean(userId),
  });

  const documentsQuery = useQuery({
    queryKey: [QUERY_KEY, 'documents', userId, year],
    queryFn: async (): Promise<Document[]> => {
      if (!userId || !hasSupabaseConfig) return [];
      const yearStart = `${year}-01-01T00:00:00`;
      const yearEnd = `${year}-12-31T23:59:59`;
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_template', false)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message ?? 'Failed to load documents');
      return (data ?? []) as Document[];
    },
    enabled: Boolean(userId),
  });

  const transactions = transactionsQuery.data ?? [];
  const docs = documentsQuery.data ?? [];
  const summary: TaxSummary | null = transactions.length > 0
    ? computeTaxSummary({ year, start, end, transactions })
    : {
        period: { start, end, label: `YTD ${year}` },
        totalIncome: 0,
        totalExpenses: 0,
        totalDeductible: 0,
        byCategory: [],
        warnings: [],
      };

  const createPackageFiles = useMutation({
    mutationFn: async (): Promise<PackageFile[]> => {
      const files: PackageFile[] = [];
      const generatedAt = new Date().toLocaleString('en-US');

      let cpaNotes: string | null = null;
      if (hasOpenAIKey && summary) {
        try {
          cpaNotes = await getCpaNotes({
            totalIncome: summary.totalIncome,
            totalExpenses: summary.totalExpenses,
            totalDeductible: summary.totalDeductible,
            warnings: summary.warnings,
          });
        } catch {
          // Never block export
        }
      }

      const taxCsv = await exportTaxCsv({ summary: summary!, transactions });
      files.push({
        uri: taxCsv.uri,
        filename: taxCsv.filename,
        mimeType: 'text/csv',
      });

      const taxPdf = await createTaxSummaryPdf({
        summary: summary!,
        businessName: profile?.business_name ?? profile?.full_name ?? undefined,
        year,
        generatedAt,
        cpaNotes: cpaNotes ?? undefined,
      });
      files.push({
        uri: taxPdf.uri,
        filename: taxPdf.filename,
        mimeType: 'application/pdf',
      });

      const docsCsv = await exportDocumentsIndexCsv({
        docs,
        year,
      });
      files.push({
        uri: docsCsv.uri,
        filename: docsCsv.filename,
        mimeType: 'text/csv',
      });

      return files;
    },
  });

  const sharePackage = useMutation({
    mutationFn: async (files: PackageFile[]) => {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error('Sharing is not available on this device');
      }
      for (let i = 0; i < files.length; i++) {
        await Sharing.shareAsync(files[i].uri, {
          mimeType: files[i].mimeType,
          dialogTitle: `Share ${files[i].filename}`,
          UTI: files[i].mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
        });
        if (i < files.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    },
  });

  return {
    summary,
    transactions,
    docs,
    businessName: profile?.business_name ?? profile?.full_name ?? null,
    isLoading: transactionsQuery.isLoading || documentsQuery.isLoading,
    error: transactionsQuery.error ?? documentsQuery.error,
    createPackageFiles,
    sharePackage,
  };
}
