import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { uploadToDocumentsBucket } from '../services/storage';
import type {
  Document,
  DocumentWithRelations,
  DocumentInsert,
  DocumentUpdate,
} from '../types/documents';

const QUERY_KEY = 'documents';

const CONTRACT_TYPES = ['contract', 'nda', 'agreement'];
const FORM_TYPES = ['w9', 'tax_form', 'license', 'certificate', 'other'];
const FORM_CATEGORIES = ['tax', 'legal'];

function matchesSearch(doc: DocumentWithRelations, term: string): boolean {
  const t = term.toLowerCase();
  const name = doc.name?.toLowerCase() ?? '';
  const desc = (doc.description ?? '').toLowerCase();
  const tags = (doc.tags ?? []).join(' ').toLowerCase();
  return name.includes(t) || desc.includes(t) || tags.includes(t);
}

export function useDocuments(filters?: {
  doc_type?: string;
  category?: string;
  search?: string;
  segment?: 'contracts' | 'forms';
}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, filters],
    queryFn: async () => {
      if (!userId) return [];
      let q = supabase
        .from('documents')
        .select(
          `
          *,
          customers (company_name, contact_name),
          vendors (company_name, contact_name)
        `
        )
        .eq('user_id', userId)
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      if (filters?.segment === 'contracts') {
        q = q.in('doc_type', CONTRACT_TYPES);
      } else if (filters?.segment === 'forms') {
        q = q.or(
          'doc_type.in.(w9,tax_form,license,certificate,other),category.in.(tax,legal)'
        );
      } else if (filters?.doc_type) {
        q = q.eq('doc_type', filters.doc_type);
      }
      if (filters?.category) q = q.eq('category', filters.category);

      const { data, error } = await q;
      if (error) throw new Error(error.message ?? 'Failed to load documents');

      let list = (data ?? []) as DocumentWithRelations[];
      if (filters?.search?.trim()) {
        const term = filters.search.trim();
        list = list.filter((d) => matchesSearch(d, term));
      }
      return list;
    },
    enabled: Boolean(userId),
  });
}

export function useDocument(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId, id],
    queryFn: async () => {
      if (!id || !userId) return null;
      const { data, error } = await supabase
        .from('documents')
        .select(
          `
          *,
          customers (company_name, contact_name),
          vendors (company_name, contact_name)
        `
        )
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return (data ?? null) as DocumentWithRelations | null;
    },
    enabled: Boolean(userId && id),
  });
}

export function useUploadDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      uri: string;
      filename: string;
      name?: string;
      description?: string;
      doc_type: DocumentInsert['doc_type'];
      category?: DocumentInsert['category'];
      related_customer_id?: string | null;
      related_vendor_id?: string | null;
      expiration_date?: string | null;
      is_signed?: boolean;
      signed_date?: string | null;
      signed_by?: string | null;
      tags?: string[] | null;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const url = await uploadToDocumentsBucket({
        userId: user.id,
        uri: params.uri,
        filename: params.filename,
      });
      if (!url) throw new Error('Failed to upload file');

      const insert: DocumentInsert = {
        user_id: user.id,
        name: params.name ?? params.filename,
        description: params.description?.trim() || null,
        doc_type: params.doc_type,
        category: params.category ?? null,
        related_customer_id: params.related_customer_id ?? null,
        related_vendor_id: params.related_vendor_id ?? null,
        file_url: url,
        file_type: params.filename.slice(params.filename.lastIndexOf('.') + 1) || null,
        tags: params.tags ?? null,
        expiration_date: params.expiration_date ?? null,
        is_signed: params.is_signed ?? false,
        signed_date: params.signed_date ?? null,
        signed_by: params.signed_by ?? null,
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(insert)
        .select()
        .single();

      if (error) throw new Error(error.message ?? 'Failed to save document');
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DocumentUpdate }) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { data, error } = await supabase
        .from('documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message ?? 'Failed to update document');
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('You must be signed in');
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
