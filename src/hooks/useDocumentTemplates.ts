import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { uploadTextToDocumentsBucket } from '../services/storage';
import {
  generateDocumentText,
  type DocumentGenerateType,
} from '../services/openai';
import {
  templates,
  getTemplate,
  type TemplateId,
  type TemplateData,
} from '../lib/templates';
import type { Document, DocumentInsert } from '../types/documents';

const DOCUMENTS_QUERY_KEY = 'documents';

const TEMPLATE_TO_AI_TYPE: Record<TemplateId, DocumentGenerateType> = {
  nda_v1: 'nda',
  service_agreement_v1: 'service_agreement',
  contractor_agreement_v1: 'contractor_agreement',
  w9_request_letter_v1: 'w9_request_letter',
};

export function useTemplates() {
  return { data: templates, isLoading: false };
}

export function useGenerateFromTemplate() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateId: TemplateId;
      templateData: TemplateData;
      generatedContent: string;
      title: string;
      generatedByAI?: boolean;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const template = getTemplate(params.templateId);
      if (!template) throw new Error('Template not found');

      const slug = params.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50) || 'document';
      const filename = `${slug}.txt`;
      const url = await uploadTextToDocumentsBucket({
        userId: user.id,
        filename,
        content: params.generatedContent,
      });

      if (!url) throw new Error('Failed to upload document');

      const insert: DocumentInsert = {
        user_id: user.id,
        name: params.title,
        description: null,
        doc_type: template.doc_type,
        category: template.category,
        file_url: url,
        file_type: 'txt',
        file_size: new TextEncoder().encode(params.generatedContent).length,
        tags: ['template', params.templateId],
        content_text: params.generatedContent,
        template_id: params.templateId,
        generated_by_ai: params.generatedByAI ?? false,
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
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
    },
  });
}

export function useGenerateFromTemplateWithAI() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateId: TemplateId;
      templateData: TemplateData;
      useAI: boolean;
    }) => {
      const template = getTemplate(params.templateId);
      if (!template) throw new Error('Template not found');

      const business = {
        name: profile?.business_name || profile?.full_name || undefined,
        address: undefined,
      };

      let title: string;
      let content: string;

      if (params.useAI && template.aiPrompt) {
        const aiType = TEMPLATE_TO_AI_TYPE[params.templateId] ?? 'custom';
        const result = await generateDocumentText({
          type: aiType,
          profile: { business_name: profile?.business_name, full_name: profile?.full_name },
          otherParty: {
            name: (params.templateData as { partyName?: string }).partyName || '',
            address: (params.templateData as { partyAddress?: string }).partyAddress,
            email: (params.templateData as { partyEmail?: string }).partyEmail,
          },
          specificTerms: (params.templateData as { projectScope?: string }).projectScope ||
            (params.templateData as { termMonths?: string }).termMonths,
        });
        title = result.title;
        content = result.content;
      } else {
        title = template.name;
        content = template.renderTemplate(params.templateData as never, business);
      }

      return { title, content, template };
    },
  });
}

export function useSaveGeneratedDocument() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      doc_type: DocumentInsert['doc_type'];
      category: DocumentInsert['category'];
      template_id?: string | null;
      generated_by_ai: boolean;
      related_customer_id?: string | null;
      related_vendor_id?: string | null;
    }) => {
      if (!user?.id) throw new Error('You must be signed in');

      const slug = params.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50) || 'document';
      const filename = `${slug}.txt`;
      const url = await uploadTextToDocumentsBucket({
        userId: user.id,
        filename,
        content: params.content,
      });

      if (!url) throw new Error('Failed to upload document');

      const insert: DocumentInsert = {
        user_id: user.id,
        name: params.title,
        description: null,
        doc_type: params.doc_type,
        category: params.category,
        file_url: url,
        file_type: 'txt',
        file_size: new TextEncoder().encode(params.content).length,
        content_text: params.content,
        template_id: params.template_id ?? null,
        generated_by_ai: params.generated_by_ai,
        related_customer_id: params.related_customer_id ?? null,
        related_vendor_id: params.related_vendor_id ?? null,
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
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
    },
  });
}

export function useGenerateCustomDocument() {
  return useMutation({
    mutationFn: async (params: {
      description: string;
      docType: DocumentGenerateType;
      profile?: { business_name?: string | null; full_name?: string | null };
      otherParty?: { name: string; address?: string; email?: string };
    }) => {
      const result = await generateDocumentText({
        type: params.docType,
        profile: params.profile,
        otherParty: params.otherParty,
        customDescription: params.description,
      });
      return result;
    },
  });
}
