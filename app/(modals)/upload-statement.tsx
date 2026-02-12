import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { parseCSVStatement, type ParsedTransaction } from '../../src/services/parser';
import { categorizeTransactionsBatch } from '../../src/services/openai';
import { useUploadStatement } from '../../src/hooks/useUploadStatement';
import { useAuth } from '../../src/providers/AuthProvider';
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
  const [step, setStep] = useState<'select' | 'processing' | 'review' | 'import'>('select');
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');

  const selectFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setStep('processing');
      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: 'utf8',
      });

      const { transactions } = parseCSVStatement(content);
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
        }))
      );

      catResults.forEach((res, i) => {
        if (i < withIds.length) {
          withIds[i].category = res.category;
          withIds[i].confidence = res.confidence;
        }
      });

      setRows(withIds);
      setStep('review');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
      setStep('select');
    }
  }, []);

  const toggleSelect = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const setCategory = (id: string, category: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category } : r))
    );
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
      await uploadMutation.mutateAsync(
        selected.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          category: r.category,
          vendor: r.description,
        }))
      );
      Alert.alert(
        'Success',
        `Imported ${selected.length} transaction(s).`,
        [{ text: 'OK', onPress: () => router.back() }]
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
        <Text style={sharedStyles.sub}>
          Select a CSV file from your bank. We'll detect columns for Date, Description, and Amount (or Debit/Credit).
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
                        onPress={() => setCategory(r.id, c.id)}
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
                  {r.confidence > 0 && (
                    <Text style={{ color: '#94A3B8', fontSize: 10 }}>
                      {Math.round(r.confidence * 100)}%
                    </Text>
                  )}
                </View>
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
