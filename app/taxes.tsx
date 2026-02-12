import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaxSummary } from '../src/hooks/useTaxSummary';
import { getDefaultPeriods } from '../src/services/tax';
import { shareTaxCsv } from '../src/services/export';
import { hasSupabaseEnv } from '../src/services/env';
import { getTaxTips, hasOpenAIKey } from '../src/services/openai';

const shared = {
  screen: { flex: 1, backgroundColor: '#0F172A' as const },
  padding: { padding: 24 },
  back: { color: '#3B82F6' as const, fontSize: 16, marginBottom: 24 },
  title: { color: '#F8FAFC' as const, fontSize: 24, fontWeight: 'bold' as const, marginBottom: 24 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
};

export default function TaxesScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState('YTD');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(false);
  const [taxTips, setTaxTips] = useState<string | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);

  const { data, isLoading } = useTaxSummary({
    year,
    period,
    customStart: period === 'Custom' ? customStart : undefined,
    customEnd: period === 'Custom' ? customEnd : undefined,
  });

  const summary = data?.summary;
  const transactions = data?.transactions ?? [];
  const periods = getDefaultPeriods(year);

  useEffect(() => {
    if (!hasOpenAIKey || !summary || transactions.length === 0) {
      setTaxTips(null);
      return;
    }
    setLoadingTips(true);
    getTaxTips({
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      totalDeductible: summary.totalDeductible,
    })
      .then((tips) => setTaxTips(tips))
      .finally(() => setLoadingTips(false));
  }, [summary?.totalIncome, summary?.totalExpenses, summary?.totalDeductible, transactions.length]);

  const handleExportCsv = async () => {
    if (!summary) return;
    setExporting(true);
    try {
      await shareTaxCsv({ summary, transactions });
    } catch (e) {
      Alert.alert('Export Failed', (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const navigateToTransactions = (category: string) => {
    if (summary) {
      router.push(
        `/(tabs)/transactions?category=${category}&start=${summary.period.start}&end=${summary.period.end}` as never
      );
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={[shared.screen, shared.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to view tax summary.</Text>
      </View>
    );
  }

  return (
    <View style={shared.screen}>
      <ScrollView contentContainerStyle={[shared.padding, { paddingBottom: 120 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={shared.title}>Tax Prep</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <TouchableOpacity
                key={y}
                onPress={() => setYear(y)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: year === y ? '#3B82F6' : '#1E293B',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: year === y ? '#fff' : '#94A3B8', fontWeight: '500' }}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {periods.map((p) => (
              <TouchableOpacity
                key={p.label}
                onPress={() => setPeriod(p.label)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: period === p.label ? '#3B82F6' : '#1E293B',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: period === p.label ? '#fff' : '#94A3B8', fontSize: 14 }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {period === 'Custom' && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Start</Text>
              <TextInput
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  padding: 12,
                  color: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="yyyy-mm-dd"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>End</Text>
              <TextInput
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  padding: 12,
                  color: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="yyyy-mm-dd"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
        ) : !summary ? (
          <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 24 }}>
            Select a period to view summary.
          </Text>
        ) : transactions.length === 0 ? (
          <View style={shared.card}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No transactions in this period.</Text>
            <TouchableOpacity
              style={shared.button}
              onPress={() => router.push('/(modals)/upload-statement' as never)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Upload Statement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <View style={[shared.card, { flex: 1, minWidth: 140 }]}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Total Income</Text>
                <Text style={{ color: '#10B981', fontSize: 20, fontWeight: 'bold' }}>
                  ${summary.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={[shared.card, { flex: 1, minWidth: 140 }]}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Total Expenses</Text>
                <Text style={{ color: '#EF4444', fontSize: 20, fontWeight: 'bold' }}>
                  ${summary.totalExpenses.toFixed(2)}
                </Text>
              </View>
              <View style={[shared.card, { flex: 1, minWidth: 140 }]}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Total Deductible</Text>
                <Text style={{ color: '#3B82F6', fontSize: 20, fontWeight: 'bold' }}>
                  ${summary.totalDeductible.toFixed(2)}
                </Text>
              </View>
              <View style={[shared.card, { flex: 1, minWidth: 140 }]}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Net</Text>
                <Text
                  style={{
                    color: summary.totalIncome - summary.totalExpenses >= 0 ? '#10B981' : '#EF4444',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}
                >
                  ${(summary.totalIncome - summary.totalExpenses).toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>
              By Category
            </Text>
            {summary.byCategory.map((c) => (
              <TouchableOpacity
                key={c.category}
                onPress={() => navigateToTransactions(c.category)}
                style={[shared.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              >
                <View>
                  <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{c.name}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{c.txCount} transactions</Text>
                </View>
                <Text style={{ color: '#3B82F6', fontWeight: '600' }}>
                  ${c.deductibleAmount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}

            {hasOpenAIKey && (taxTips || loadingTips) && (
              <View style={[shared.card, { marginTop: 24 }]}>
                <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 8 }}>Tax Tips</Text>
                {loadingTips ? (
                  <ActivityIndicator color="#3B82F6" size="small" />
                ) : taxTips ? (
                  <Text style={{ color: '#94A3B8', fontSize: 14 }}>{taxTips}</Text>
                ) : null}
              </View>
            )}

            {summary.warnings.length > 0 && (
              <>
                <Text style={{ color: '#F8FAFC', fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
                  Warnings & Tips
                </Text>
                {summary.warnings.map((w, i) => (
                  <View
                    key={i}
                    style={[
                      shared.card,
                      {
                        borderLeftWidth: 4,
                        borderLeftColor:
                          w.severity === 'warning' ? '#F59E0B' : w.severity === 'action' ? '#3B82F6' : '#94A3B8',
                      },
                    ]}
                  >
                    <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{w.title}</Text>
                    <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 14 }}>{w.body}</Text>
                    {w.ctaLabel && w.ctaRoute && (
                      <TouchableOpacity
                        onPress={() => router.push(w.ctaRoute! as never)}
                        style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ color: '#3B82F6', fontWeight: '500' }}>{w.ctaLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {summary && transactions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            paddingBottom: 40,
            backgroundColor: '#0F172A',
            borderTopWidth: 1,
            borderTopColor: '#1E293B',
          }}
        >
          <TouchableOpacity
            style={shared.button}
            onPress={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Export CSV</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={shared.buttonSecondary}
            onPress={handleExportCsv}
            disabled={exporting}
          >
            <Text style={{ color: '#F8FAFC' }}>Share with CPA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
