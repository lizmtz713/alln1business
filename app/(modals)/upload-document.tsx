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
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useUploadDocument } from '../../src/hooks/useDocuments';
import { useCustomers } from '../../src/hooks/useCustomers';
import { useVendors } from '../../src/hooks/useVendors';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import type { DocType, DocCategory } from '../../src/types/documents';

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

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: customers = [] } = useCustomers();
  const { data: vendors = [] } = useVendors();
  const uploadDoc = useUploadDocument();

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState<DocType>('other');
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [relatedCustomerId, setRelatedCustomerId] = useState<string | null>(null);
  const [relatedVendorId, setRelatedVendorId] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const canSave = hasSupabaseEnv && user && fileUri && filename && name.trim();

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFilename(asset.name ?? 'document');
      if (!name.trim()) setName(asset.name ?? 'document');
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSave = async () => {
    if (!canSave || !fileUri) return;
    const tags = tagsInput.trim()
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : null;

    try {
      await uploadDoc.mutateAsync({
        uri: fileUri,
        filename,
        name: name.trim(),
        description: description.trim() || undefined,
        doc_type: docType,
        category: category ?? undefined,
        related_customer_id: relatedCustomerId ?? null,
        related_vendor_id: relatedVendorId ?? null,
        expiration_date: expirationDate.trim() || null,
        is_signed: isSigned,
        signed_date: signedDate.trim() || null,
        signed_by: signedBy.trim() || null,
        tags: tags ?? undefined,
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
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to upload documents.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Upload Document
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>File (PDF, JPG, PNG) *</Text>
        <TouchableOpacity
          onPress={pickFile}
          style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#3B82F6' }}>{filename || 'Choose file'}</Text>
        </TouchableOpacity>

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

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Link to Customer</Text>
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

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Link to Vendor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
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
          disabled={!canSave || uploadDoc.isPending}
          style={{
            backgroundColor: canSave ? '#3B82F6' : '#334155',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {uploadDoc.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
