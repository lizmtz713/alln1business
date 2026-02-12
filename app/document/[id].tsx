import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDocument, useDeleteDocument } from '../../src/hooks/useDocuments';
import { hasSupabaseEnv } from '../../src/services/env';
import { format, parseISO } from 'date-fns';

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doc, isLoading } = useDocument(id);
  const deleteDoc = useDeleteDocument();

  const handleOpen = () => {
    if (doc?.file_url) Linking.openURL(doc.file_url);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await deleteDoc.mutateAsync(id);
              router.back();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for documents.</Text>
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

  const customer = doc.customers;
  const vendor = doc.vendors;
  const linkedName = customer?.company_name || customer?.contact_name || vendor?.company_name || vendor?.contact_name || null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
          {doc.name}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <View style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}>
              {doc.doc_type.replace('_', ' ')}
            </Text>
          </View>
          {doc.category && (
            <View style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}>
                {doc.category}
              </Text>
            </View>
          )}
        </View>

        {linkedName && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Linked to</Text>
            <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{linkedName}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleOpen}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Open File</Text>
        </TouchableOpacity>

        {(doc.is_signed || doc.expiration_date) && (
          <View style={{ marginBottom: 24 }}>
            {doc.is_signed && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Signed</Text>
                <Text style={{ color: '#F8FAFC' }}>
                  {doc.signed_date ? format(parseISO(doc.signed_date), 'MMM d, yyyy') : 'Yes'}
                  {doc.signed_by && ` by ${doc.signed_by}`}
                </Text>
              </View>
            )}
            {doc.expiration_date && (
              <View>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Expires</Text>
                <Text style={{ color: '#F8FAFC' }}>{format(parseISO(doc.expiration_date), 'MMM d, yyyy')}</Text>
              </View>
            )}
          </View>
        )}

        {(doc.tags ?? []).length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 8 }}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(doc.tags ?? []).map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 14 }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {doc.description && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Description</Text>
            <Text style={{ color: '#F8FAFC' }}>{doc.description}</Text>
          </View>
        )}

        <Text style={{ color: '#64748B', fontSize: 12 }}>
          Added {format(parseISO(doc.created_at), 'MMM d, yyyy')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
          <TouchableOpacity
            onPress={() => router.push(`/(modals)/edit-document/${id}` as never)}
            style={{ flex: 1, backgroundColor: '#334155', borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ flex: 1, backgroundColor: '#7F1D1D', borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#FCA5A5', fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
