import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getTemplate,
  useGenerateFromTemplateWithAI,
  useGenerateFromTemplate,
} from '../../../src/hooks/useDocumentTemplates';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';
import { hasOpenAIKey } from '../../../src/services/openai';
import type { TemplateId, TemplateData } from '../../../src/lib/templates';

const inputStyle = {
  backgroundColor: '#1E293B' as const,
  borderRadius: 12,
  padding: 12,
  color: '#F8FAFC' as const,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#334155' as const,
};


export default function UseTemplateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const templateId = (Array.isArray(id) ? id[0] : id) as TemplateId;
  const template = getTemplate(templateId);

  const generateWithAI = useGenerateFromTemplateWithAI();
  const saveToVault = useGenerateFromTemplate();

  const [step, setStep] = useState<'form' | 'review'>('form');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [usedAI, setUsedAI] = useState(false);

  useEffect(() => {
    setFormData({
      partyName: '',
      partyAddress: '',
      partyEmail: '',
      effectiveDate: '',
      jurisdiction: '',
      disclosingParty: profile?.business_name || profile?.full_name || '',
      receivingParty: '',
      termMonths: '24',
      projectScope: '',
      paymentTerms: '',
      termLength: '',
      vendorName: '',
      dueDate: '',
    });
  }, [templateId, profile]);

  const updateField = (key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!template) return;
    const partyName = formData.partyName?.trim();
    if (!partyName) {
      Alert.alert('Required', 'Party name is required');
      return;
    }

    const templateData: TemplateData = {
      partyName,
      partyAddress: formData.partyAddress || undefined,
      partyEmail: formData.partyEmail || undefined,
      effectiveDate: formData.effectiveDate || undefined,
      jurisdiction: formData.jurisdiction || undefined,
      disclosingParty: formData.disclosingParty || undefined,
      receivingParty: formData.receivingParty || undefined,
      termMonths: formData.termMonths || undefined,
      projectScope: formData.projectScope || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      termLength: formData.termLength || undefined,
      vendorName: formData.vendorName || undefined,
      dueDate: formData.dueDate || undefined,
    };

    try {
      const result = await generateWithAI.mutateAsync({
        templateId,
        templateData,
        useAI: hasOpenAIKey,
      });
      setGeneratedTitle(result.title);
      setGeneratedContent(result.content);
      setUsedAI(hasOpenAIKey);
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
        templateId,
        templateData: formData as unknown as TemplateData,
        generatedContent,
        title: generatedTitle,
        generatedByAI: usedAI,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleCopy = async () => {
    try {
      await Share.share({ message: generatedContent, title: generatedTitle });
    } catch {
      Alert.alert('Copy', 'Use your device share option to copy the text.');
    }
  };

  if (!template) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Template not found</Text>
      </View>
    );
  }

  if (step === 'review') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <TouchableOpacity onPress={() => setStep('form')} style={{ marginBottom: 24 }}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
            Review & Edit
          </Text>
          <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
            Edit the content below, then save to your vault.
          </Text>

          <TextInput
            style={[
              inputStyle,
              {
                minHeight: 320,
                textAlignVertical: 'top',
                marginBottom: 24,
              },
            ]}
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
              marginBottom: 12,
            }}
          >
            {saveToVault.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Save to Vault</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCopy}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#F8FAFC', fontWeight: '500' }}>Share / Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: 'transparent',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#94A3B8' }}>Cancel</Text>
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
          {template.name}
        </Text>
        <Text style={{ color: '#94A3B8', marginBottom: 24 }}>{template.description}</Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Party Name *</Text>
        <TextInput
          style={inputStyle}
          value={formData.partyName}
          onChangeText={(v) => updateField('partyName', v)}
          placeholder="Name or company"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Address</Text>
        <TextInput
          style={inputStyle}
          value={formData.partyAddress}
          onChangeText={(v) => updateField('partyAddress', v)}
          placeholder="Optional"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Email</Text>
        <TextInput
          style={inputStyle}
          value={formData.partyEmail}
          onChangeText={(v) => updateField('partyEmail', v)}
          placeholder="Optional"
          placeholderTextColor="#64748B"
          keyboardType="email-address"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Effective Date</Text>
        <TextInput
          style={inputStyle}
          value={formData.effectiveDate}
          onChangeText={(v) => updateField('effectiveDate', v)}
          placeholder="yyyy-MM-dd"
          placeholderTextColor="#64748B"
        />

        {(templateId === 'nda_v1') && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Disclosing Party (your company)</Text>
            <TextInput
              style={inputStyle}
              value={formData.disclosingParty}
              onChangeText={(v) => updateField('disclosingParty', v)}
              placeholder={profile?.business_name || 'Your company name'}
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Term (months)</Text>
            <TextInput
              style={inputStyle}
              value={formData.termMonths}
              onChangeText={(v) => updateField('termMonths', v)}
              placeholder="24"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
            />
          </>
        )}

        {['service_agreement_v1', 'contractor_agreement_v1'].includes(templateId) && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Project / Scope</Text>
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
              value={formData.projectScope}
              onChangeText={(v) => updateField('projectScope', v)}
              placeholder="Describe scope of work"
              placeholderTextColor="#64748B"
              multiline
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Payment Terms</Text>
            <TextInput
              style={inputStyle}
              value={formData.paymentTerms}
              onChangeText={(v) => updateField('paymentTerms', v)}
              placeholder="e.g. Net 30, 50% upfront"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Term Length</Text>
            <TextInput
              style={inputStyle}
              value={formData.termLength}
              onChangeText={(v) => updateField('termLength', v)}
              placeholder="e.g. 6 months, Project-based"
              placeholderTextColor="#64748B"
            />
          </>
        )}

        {templateId === 'w9_request_letter_v1' && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vendor Name</Text>
            <TextInput
              style={inputStyle}
              value={formData.vendorName}
              onChangeText={(v) => updateField('vendorName', v)}
              placeholder="Defaults to party name"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Due Date</Text>
            <TextInput
              style={inputStyle}
              value={formData.dueDate}
              onChangeText={(v) => updateField('dueDate', v)}
              placeholder="e.g. within 10 days"
              placeholderTextColor="#64748B"
            />
          </>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Jurisdiction / State</Text>
        <TextInput
          style={inputStyle}
          value={formData.jurisdiction}
          onChangeText={(v) => updateField('jurisdiction', v)}
          placeholder="Optional"
          placeholderTextColor="#64748B"
        />

        {hasOpenAIKey && (
          <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 16 }}>
            AI will generate a professional draft. Fallback to template if unavailable.
          </Text>
        )}

        <TouchableOpacity
          onPress={handleGenerate}
          disabled={!formData.partyName?.trim() || generateWithAI.isPending}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {generateWithAI.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {hasOpenAIKey ? 'Generate with AI' : 'Generate'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
