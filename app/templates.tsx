import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTemplates } from '../src/hooks/useDocumentTemplates';
import { hasSupabaseEnv } from '../src/services/env';

export default function TemplatesScreen() {
  const router = useRouter();
  const { data: templates = [] } = useTemplates();
  const [search, setSearch] = useState('');

  const filtered = templates.filter((t) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      t.doc_type.toLowerCase().includes(term)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Templates
        </Text>

        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={search}
          onChangeText={setSearch}
          placeholder="Search templates..."
          placeholderTextColor="#64748B"
        />

        {!hasSupabaseEnv && (
          <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
            Connect Supabase to save generated documents to your vault.
          </Text>
        )}

        {filtered.map((t) => (
          <View
            key={t.id}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>
                  {t.name}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
                  {t.description}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#334155',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 11, textTransform: 'capitalize' }}>
                  {t.doc_type.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/(modals)/use-template/${t.id}` as never)}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 10,
                padding: 12,
                marginTop: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Use Template</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filtered.length === 0 && (
          <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 24 }}>
            No templates match your search
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
