import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCategoryRules, useUpdateCategoryRule, useDeleteCategoryRule } from '../src/hooks/useCategoryRules';
import { hasSupabaseEnv } from '../src/services/env';
import { getCategoryName } from '../src/lib/categories';
import type { CategoryRule } from '../src/types/categoryRules';

function matchTypeLabel(t: string): string {
  if (t === 'vendor_exact') return 'Vendor (exact)';
  if (t === 'vendor_contains') return 'Vendor (contains)';
  if (t === 'description_contains') return 'Description (contains)';
  return t;
}

export default function RulesScreen() {
  const router = useRouter();
  const { data: rules = [], isLoading } = useCategoryRules();
  const updateRule = useUpdateCategoryRule();
  const deleteRule = useDeleteCategoryRule();
  const [search, setSearch] = useState('');

  const filtered = rules.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.match_value.toLowerCase().includes(q) ||
      getCategoryName(r.category).toLowerCase().includes(q)
    );
  });

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to manage categorization rules.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Categorization Rules
        </Text>
        <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
          When you change a category, you can save it as a rule. Future similar transactions will
          auto-categorize.
        </Text>

        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={search}
          onChangeText={setSearch}
          placeholder="Search rules..."
          placeholderTextColor="#64748B"
        />

        {isLoading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 24 }}>
            {search.trim() ? 'No matching rules.' : 'No rules yet. Change a category and choose "Remember this" to create one.'}
          </Text>
        ) : (
          filtered.map((r: CategoryRule) => (
            <View
              key={r.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: r.is_active ? '#334155' : '#475569',
                opacity: r.is_active ? 1 : 0.7,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
                  {r.match_value}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Rule',
                      `Remove rule for "${r.match_value}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteRule.mutate(r.id),
                        },
                      ]
                    );
                  }}
                  style={{ padding: 4 }}
                >
                  <Text style={{ color: '#EF4444', fontSize: 14 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>
                {matchTypeLabel(r.match_type)} → {getCategoryName(r.category)}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 8 }}>
                Applies to: {r.applies_to}
              </Text>
              <TouchableOpacity
                onPress={() => updateRule.mutate({ id: r.id, updates: { is_active: !r.is_active } })}
                disabled={updateRule.isPending}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: r.is_active ? '#334155' : '#10B98133',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: r.is_active ? '#94A3B8' : '#10B981', fontSize: 13 }}>
                  {r.is_active ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
