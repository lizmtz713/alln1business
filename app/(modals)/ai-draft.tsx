import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useGenerateCustomDocument,
  useSaveGeneratedDocument,
} from '../../src/hooks/useDocumentTemplates';
import { useCustomers } from '../../src/hooks/useCustomers';
import { useVendors } from '../../src/hooks/useVendors';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { hasOpenAIKey } from '../../src/services/openai';
import type { DocumentGenerateType } from '../../src/services/openai';
import type { DocType, DocCategory } from '../../src/types/documents';

const DOC_TYPES: { id: DocumentGenerateType; label: string; docType: DocType; category: DocCategory }[] = [
  { id: 'nda', label: 'NDA', docType: 'nda', category: 'legal' },
  { id: 'service_agreement', label: 'Service Agreement', docType: 'agreement', category: 'customer' },
  { id: 'contractor_agreement', label: 'Contractor Agreement', docType: 'contract', category: 'vendor' },
  { id: 'w9_request_letter', label: 'W-9 Request', docType: 'other', category: 'tax' },
  { id: 'custom', label: 'Custom', docType: 'other', category: 'other' },
];

const inputStyle = {
  backgroundColor: '#1E293B' as const,
  borderRadius: 12,
  padding: 12,
  color: '#F8FAFC' as const,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#334155' as const,
};

export default function AiDraftScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: customers = [] } = useCustomers();
  const { data: vendors = [] } = useVendors();
  const generateCustom = useGenerateCustomDocument();
  const saveToVault = useSaveGeneratedDocument();

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [description, setDescription] = useState('');
  const [docTypeId, setDocTypeId] = useState<DocumentGenerateType>('custom');
  const [relatedCustomerId, setRelatedCustomerId] = useState<string | null>(null);
  const [relatedVendorId, setRelatedVendorId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');

  const selectedType = DOC_TYPES.find((t) => t.id === docTypeId);
  const relatedCustomer = customers.find((c) => c.id === relatedCustomerId);
  const relatedVendor = vendors.find((v) => v.id === relatedVendorId);
  const otherPartyName =
    relatedCustomer?.company_name || relatedCustomer?.contact_name ||
    relatedVendor?.company_name || relatedVendor?.contact_name ||
    '';

  const handleGenerate = async () => {
    const desc = description.trim();
    if (!desc && docTypeId === 'custom') {
      Alert.alert('Required', 'Describe what you need or select a document type.');
      return;
    }
    if (!hasOpenAIKey) {
      Alert.alert(
        'OpenAI Key Required',
        'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env to use AI document generation.'
      );
      return;
    }

    try {
      const result = await generateCustom.mutateAsync({
        description: desc || `${docTypeId.replace('_', ' ')} document`,
        docType: docTypeId,
        profile: { business_name: profile?.business_name, full_name: profile?.full_name },
        otherParty: otherPartyName ? { name: otherPartyName } : undefined,
      });
      setGeneratedTitle(result.title);
      setGeneratedContent(result.content);
      setStep('review');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleSaveToVault = async () => {
    if (!hasSupabaseEnv) {
      Alert.alert('Supabase Required', 'Connect Supabase to save documents to your vault.');
      return;
    }
    try {
      await saveToVault.mutateAsync({
        title: generatedTitle,
        content: generatedContent,
        doc_type: selectedType?.docType ?? 'other',
        category: selectedType?.category ?? 'other',
        template_id: null,
        generated_by_ai: true,
        related_customer_id: relatedCustomerId,
        related_vendor_id: relatedVendorId,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasOpenAIKey) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
          AI Draft
        </Text>
        <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
          Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file to use AI document generation. You can
          still use templates from the Templates library for non-AI drafts.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/templates' as never)}
          style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Browse Templates</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'review') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <TouchableOpacity onPress={() => setStep('input')} style={{ marginBottom: 24 }}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
            Review & Edit
          </Text>
          <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
            Edit the content below, then save to your vault.
          </Text>

          <TextInput
            style={[inputStyle, { minHeight: 320, textAlignVertical: 'top', marginBottom: 24 }]}
            value={generatedContent}
            onChangeText={setGeneratedContent}
            multiline
            placeholder="Document content"
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity
            onPress={handleSaveToVault}
            disabled={!hasSupabaseEnv || saveToVault.isPending}
            style={{
              backgroundColor: hasSupabaseEnv ? '#3B82F6' : '#334155',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
          >
            {saveToVault.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Save to Vault</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
          AI Draft
        </Text>
        <Text style={{ color: '#94A3B8', marginBottom: 24 }}>
          Describe what you need and we&apos;ll generate a draft for you.
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>What do you need?</Text>
        <TextInput
          style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. An NDA for a new vendor, a service agreement for consulting work..."
          placeholderTextColor="#64748B"
          multiline
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Document Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {DOC_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setDocTypeId(t.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: docTypeId === t.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Link to Customer (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setRelatedCustomerId(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: !relatedCustomerId ? '#3B82F6' : '#1E293B',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC' }}>None</Text>
          </TouchableOpacity>
          {customers.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setRelatedCustomerId(c.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: relatedCustomerId === c.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC' }} numberOfLines={1}>
                {c.company_name || c.contact_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Link to Vendor (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setRelatedVendorId(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: !relatedVendorId ? '#3B82F6' : '#1E293B',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC' }}>None</Text>
          </TouchableOpacity>
          {vendors.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setRelatedVendorId(v.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: relatedVendorId === v.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC' }} numberOfLines={1}>{v.company_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generateCustom.isPending}
          style={{ backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          {generateCustom.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Generate</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
