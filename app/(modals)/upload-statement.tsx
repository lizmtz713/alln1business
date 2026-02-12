import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { parseCSVStatement, type ParsedTransaction } from '../../src/services/parser';
import { categorizeTransactionsBatch } from '../../src/services/openai';
import { applyCategoryRules } from '../../src/services/rules';
import { buildSuggestedRuleFromEdit } from '../../src/services/rules';
import { useActiveCategoryRules, useCreateCategoryRule } from '../../src/hooks/useCategoryRules';
import { LearnCategoryPrompt } from '../../src/components/LearnCategoryPrompt';
import { useUploadStatement } from '../../src/hooks/useUploadStatement';
import { useAuth } from '../../src/providers/AuthProvider';
import { useBankAccounts } from '../../src/hooks/useBankAccounts';
import { hasSupabaseEnv } from '../../src/services/env';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryName,
  type CategoryItem,
} from '../../src/lib/categories';

type ReviewRow = ParsedTransaction & {
  id: string;
  selected: boolean;
  category: string;
  confidence: number;
  source?: 'rule' | 'ai';
};

const sharedStyles = {
  screen: { flex: 1, backgroundColor: '#0F172A' as const },
  padding: { padding: 24 },
  back: { color: '#3B82F6' as const, fontSize: 16, marginBottom: 24 },
  title: { color: '#F8FAFC' as const, fontSize: 24, fontWeight: 'bold' as const, marginBottom: 24 },
  sub: { color: '#94A3B8' as const, marginBottom: 16 },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  buttonText: { color: '#fff' as const, fontWeight: '600' as const, fontSize: 16 },
};

export default function UploadStatementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const uploadMutation = useUploadStatement();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: rules = [] } = useActiveCategoryRules();
  const createRule = useCreateCategoryRule();
  const [step, setStep] = useState<'select' | 'processing' | 'review' | 'import'>('select');
  const [learnPromptRowId, setLearnPromptRowId] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [parseMetadata, setParseMetadata] = useState<{
    startDate?: string;
    endDate?: string;
    startingBalance?: number;
    endingBalance?: number;
  }>({});

  const selectFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setStep('processing');
      const uri = result.assets[0].uri;
      const name = result.assets[0].name ?? '';
      setFilename(name);

      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: 'utf8',
      });

      const { transactions, metadata } = parseCSVStatement(content);
      setParseMetadata(metadata ?? {});
      if (transactions.length === 0) {
        Alert.alert('No Data', 'No valid transactions found in the CSV.');
        setStep('select');
        return;
      }

      const withIds: ReviewRow[] = transactions.map((t, i) => ({
        ...t,
        id: `row-${i}`,
        selected: true,
        category: 'other',
        confidence: 0,
      }));

      const catResults = await categorizeTransactionsBatch(
        withIds.map((r) => ({
          vendor: r.description,
          amount: r.type === 'expense' ? -r.amount : r.amount,
          description: null,
        })),
        rules
      );

      catResults.forEach((res, i) => {
        if (i < withIds.length) {
          withIds[i].category = res.category;
          withIds[i].confidence = res.confidence;
          withIds[i].source = res.source;
        }
      });

      setRows(withIds);
      setStep('review');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
      setStep('select');
    }
  }, [rules]);

  const toggleSelect = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const setCategory = (id: string, category: string, prevCategory?: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category } : r))
    );
    if (prevCategory !== category) {
      const row = rows.find((r) => r.id === id);
      if (row?.description?.trim()) setLearnPromptRowId(id);
    }
  };

  const selectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  const deselectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

  const applyBulkCategory = () => {
    if (!bulkCategory) return;
    setRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, category: bulkCategory } : r))
    );
  };

  const doImport = async () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      Alert.alert('No Selection', 'Select at least one transaction to import.');
      return;
    }

    setStep('import');
    try {
      await uploadMutation.mutateAsync({
        rows: selected.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          category: r.category,
          vendor: r.description,
        })),
        filename: filename || undefined,
        bankAccountId: bankAccountId ?? undefined,
        startDate: parseMetadata.startDate ?? null,
        endDate: parseMetadata.endDate ?? null,
        startingBalance: parseMetadata.startingBalance ?? null,
        endingBalance: parseMetadata.endingBalance ?? null,
      });
      Alert.alert(
        'Success',
        `Imported ${selected.length} transaction(s).`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)' as never) }]
      );
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv || !user) {
    return (
      <View style={[sharedStyles.screen, sharedStyles.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={sharedStyles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={sharedStyles.sub}>Connect Supabase to upload statements.</Text>
      </View>
    );
  }

  if (step === 'select') {
    return (
      <View style={[sharedStyles.screen, sharedStyles.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={sharedStyles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={sharedStyles.title}>Upload Statement</Text>

        {bankAccounts.length > 0 ? (
          <>
            <Text style={sharedStyles.sub}>Bank Account (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setBankAccountId(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: !bankAccountId ? '#3B82F6' : '#1E293B',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#F8FAFC' }}>None</Text>
              </TouchableOpacity>
              {bankAccounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setBankAccountId(a.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: bankAccountId === a.id ? '#3B82F6' : '#1E293B',
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#F8FAFC' }}>{a.account_name}</Text>
                  {a.last_four && (
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>••••{a.last_four}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(modals)/add-bank-account' as never)}
            style={[sharedStyles.button, { backgroundColor: '#334155' }]}
          >
            <Text style={sharedStyles.buttonText}>Add Bank Account</Text>
          </TouchableOpacity>
        )}

        <Text style={sharedStyles.sub}>
          Select a CSV file from your bank.
        </Text>
        <TouchableOpacity style={sharedStyles.button} onPress={selectFile}>
          <Text style={sharedStyles.buttonText}>Select CSV File</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={[sharedStyles.screen, sharedStyles.padding, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[sharedStyles.sub, { marginTop: 16 }]}>Analyzing your statement...</Text>
      </View>
    );
  }

  if (step === 'review') {
    const selectedCount = rows.filter((r) => r.selected).length;
    const categories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    return (
      <View style={sharedStyles.screen}>
        <ScrollView contentContainerStyle={sharedStyles.padding}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={sharedStyles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={sharedStyles.title}>Review Transactions</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8 }}
              onPress={selectAll}
            >
              <Text style={{ color: '#F8FAFC' }}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8 }}
              onPress={deselectAll}
            >
              <Text style={{ color: '#F8FAFC' }}>Deselect All</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#1E293B',
                borderRadius: 8,
                padding: 10,
                color: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#334155',
              }}
              placeholder="Bulk category"
              placeholderTextColor="#64748B"
              value={bulkCategory}
              onChangeText={setBulkCategory}
            />
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#334155', borderRadius: 8 }}
              onPress={applyBulkCategory}
            >
              <Text style={{ color: '#F8FAFC' }}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled>
            {rows.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: r.selected ? '#3B82F6' : '#334155',
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleSelect(r.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: '#64748B',
                      backgroundColor: r.selected ? '#3B82F6' : 'transparent',
                      marginRight: 8,
                    }}
                  />
                  <Text style={{ color: '#F8FAFC', flex: 1 }} numberOfLines={1}>
                    {r.date} • {r.description}
                  </Text>
                  <Text
                    style={{
                      color: r.type === 'income' ? '#10B981' : '#EF4444',
                      fontWeight: '600',
                    }}
                  >
                    {r.type === 'income' ? '+' : '-'}${r.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  {categories.map((c: CategoryItem) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCategory(r.id, c.id, r.category)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: r.category === c.id ? '#3B82F6' : '#334155',
                        }}
                      >
                        <Text style={{ color: '#F8FAFC', fontSize: 12 }}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  {r.source === 'rule' && (
                    <View style={{ backgroundColor: '#10B98133', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#10B981', fontSize: 10 }}>Learned</Text>
                    </View>
                  )}
                  {r.source === 'ai' && (
                    <View style={{ backgroundColor: '#3B82F633', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#3B82F6', fontSize: 10 }}>AI</Text>
                    </View>
                  )}
                  {r.confidence > 0 && !r.source && (
                    <Text style={{ color: '#94A3B8', fontSize: 10 }}>
                      {Math.round(r.confidence * 100)}%
                    </Text>
                  )}
                </View>
                {learnPromptRowId === r.id && (
                  <LearnCategoryPrompt
                    onYes={async () => {
                      const rule = buildSuggestedRuleFromEdit({
                        newCategory: r.category,
                        description: r.description || null,
                        type: r.type,
                      });
                      if (rule) {
                        try {
                          await createRule.mutateAsync(rule);
                          setLearnPromptRowId(null);
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                    onNo={() => setLearnPromptRowId(null)}
                    isPending={createRule.isPending}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[sharedStyles.button, { marginTop: 16 }]}
            onPress={doImport}
            disabled={selectedCount === 0}
          >
            <Text style={sharedStyles.buttonText}>
              Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[sharedStyles.screen, sharedStyles.padding, { justifyContent: 'center', alignItems: 'center' }]}>
      {uploadMutation.isPending ? (
        <>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[sharedStyles.sub, { marginTop: 16 }]}>Importing...</Text>
        </>
      ) : null}
    </View>
  );
}
