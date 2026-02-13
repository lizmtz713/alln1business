import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDocument, useUpdateDocument } from '../../../src/hooks/useDocuments';
import { hasSupabaseEnv } from '../../../src/services/env';
import type { DocType, DocCategory } from '../../../src/types/documents';

const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: 'contract', label: 'Contract' },
  { id: 'nda', label: 'NDA' },
  { id: 'agreement', label: 'Agreement' },
  { id: 'w9', label: 'W-9' },
  { id: 'tax_form', label: 'Tax Form' },
  { id: 'license', label: 'License' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'other', label: 'Other' },
];

const CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'employee', label: 'Employee' },
  { id: 'tax', label: 'Tax' },
  { id: 'legal', label: 'Legal' },
  { id: 'other', label: 'Other' },
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

export default function EditDocumentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doc, isLoading } = useDocument(id);
  const updateDoc = useUpdateDocument();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState<DocType>('other');
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (doc) {
      setName(doc.name ?? '');
      setDescription(doc.description ?? '');
      setDocType((doc.doc_type as DocType) ?? 'other');
      setCategory((doc.category as DocCategory) ?? null);
      setExpirationDate(doc.expiration_date?.split('T')[0] ?? '');
      setIsSigned(doc.is_signed ?? false);
      setSignedDate(doc.signed_date?.split('T')[0] ?? '');
      setSignedBy(doc.signed_by ?? '');
      setTagsInput((doc.tags ?? []).join(', '));
    }
  }, [doc]);

  const docId = Array.isArray(id) ? id[0] : id;
  const canSave = hasSupabaseEnv && docId && name.trim();

  const handleSave = async () => {
    if (!canSave || !docId) return;
    const tags = tagsInput.trim()
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : null;

    try {
      await updateDoc.mutateAsync({
        id: docId,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          doc_type: docType,
          category: category ?? null,
          related_customer_id: null,
          related_vendor_id: null,
          expiration_date: expirationDate.trim() || null,
          is_signed: isSigned,
          signed_date: signedDate.trim() || null,
          signed_by: signedBy.trim() || null,
          tags: tags ?? [],
        },
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to edit documents.</Text>
      </View>
    );
  }

  if (isLoading || !doc) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0F172A' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Edit Document
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Name *</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Document name"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Doc Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {DOC_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setDocType(t.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: docType === t.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setCategory(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: !category ? '#3B82F6' : '#1E293B',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC' }}>None</Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: category === c.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 14 }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Expiration Date</Text>
        <TextInput
          style={inputStyle}
          value={expirationDate}
          onChangeText={setExpirationDate}
          placeholder="yyyy-MM-dd"
          placeholderTextColor="#64748B"
        />

        <TouchableOpacity
          onPress={() => setIsSigned(!isSigned)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: isSigned ? '#3B82F6' : '#64748B',
              backgroundColor: isSigned ? '#3B82F6' : 'transparent',
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSigned && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>Signed</Text>
        </TouchableOpacity>
        {isSigned && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Signed Date</Text>
            <TextInput
              style={inputStyle}
              value={signedDate}
              onChangeText={setSignedDate}
              placeholder="yyyy-MM-dd"
              placeholderTextColor="#64748B"
            />
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Signed By</Text>
            <TextInput
              style={inputStyle}
              value={signedBy}
              onChangeText={setSignedBy}
              placeholder="Name"
              placeholderTextColor="#64748B"
            />
          </>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Tags (comma-separated)</Text>
        <TextInput
          style={inputStyle}
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="e.g. q1, client, renewal"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Description</Text>
        <TextInput
          style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          placeholderTextColor="#64748B"
          multiline
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || updateDoc.isPending}
          style={{
            backgroundColor: canSave ? '#3B82F6' : '#334155',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {updateDoc.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
