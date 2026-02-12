import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBankAccounts } from '../src/hooks/useBankAccounts';
import { useBankStatements } from '../src/hooks/useBankStatements';
import {
  useReconciliation,
  useReconciliationSuggestions,
  useMarkTransactionReconciled,
  useCompleteReconciliation,
} from '../src/hooks/useReconciliation';
import { hasSupabaseEnv } from '../src/services/env';
import type { Transaction } from '../src/types/transactions';
import { format } from 'date-fns';

function formatAmount(amount: number) {
  const isPos = amount >= 0;
  return `${isPos ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
}

function TransactionRow({
  item,
  checked,
  onToggle,
}: {
  item: Transaction;
  checked: boolean;
  onToggle: () => void;
}) {
  const isIncome = item.amount >= 0;
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? '#3B82F6' : '#64748B',
          backgroundColor: checked ? '#3B82F6' : 'transparent',
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F8FAFC', fontWeight: '500' }} numberOfLines={1}>
          {item.vendor || item.description || 'Unknown'}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.date}</Text>
      </View>
      <Text style={{ color: isIncome ? '#10B981' : '#EF4444', fontWeight: '600' }}>
        {formatAmount(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

export default function ReconciliationScreen() {
  const router = useRouter();
  const { data: bankAccounts = [] } = useBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const { data: statements = [] } = useBankStatements(selectedAccountId);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  const {
    statement,
    statementTransactions,
    unreconciledBookTransactions,
    bookEndingBalance,
    statementEndingBalance,
    startingBalance,
    difference,
    canComplete,
    isLoading,
  } = useReconciliation(selectedStatementId ?? undefined);

  const markReconciled = useMarkTransactionReconciled();
  const completeReconcil = useCompleteReconciliation();
  const suggestions = useReconciliationSuggestions(
    statementTransactions,
    unreconciledBookTransactions
  );

  const handleMarkReconciled = (id: string, reconciled: boolean) => {
    markReconciled.mutate({ id, reconciled });
  };

  const handleApplySuggestions = () => {
    suggestions.forEach(({ bookTxn }) => {
      handleMarkReconciled(bookTxn.id, true);
    });
  };

  const handleComplete = async () => {
    if (!selectedStatementId || !canComplete) return;
    try {
      await completeReconcil.mutateAsync(selectedStatementId);
      Alert.alert('Done', 'Reconciliation complete.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for reconciliation.</Text>
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
          Reconciliation
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Bank Account</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => {
              setSelectedAccountId(null);
              setSelectedStatementId(null);
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: !selectedAccountId ? '#3B82F6' : '#1E293B',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC' }}>All</Text>
          </TouchableOpacity>
          {bankAccounts.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => {
                setSelectedAccountId(a.id);
                setSelectedStatementId(null);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedAccountId === a.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC' }}>{a.account_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Statement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {statements.map((s) => {
            const label =
              s.filename ||
              `${s.start_date ?? '?'} – ${s.end_date ?? '?'}`;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedStatementId(s.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: selectedStatementId === s.id ? '#3B82F6' : '#1E293B',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#F8FAFC' }} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!selectedStatementId ? (
          <Text style={{ color: '#64748B' }}>Select a statement to reconcile.</Text>
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
        ) : (
          <>
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#94A3B8', marginBottom: 4 }}>Statement Ending Balance</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600' }}>
                {formatAmount(statementEndingBalance)}
              </Text>
              <Text style={{ color: '#94A3B8', marginTop: 12, marginBottom: 4 }}>Book Balance</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600' }}>
                {formatAmount(bookEndingBalance)}
              </Text>
              <Text style={{ color: '#94A3B8', marginTop: 12, marginBottom: 4 }}>Difference</Text>
              <Text
                style={{
                  color: Math.abs(difference) < 0.01 ? '#10B981' : '#EF4444',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                {formatAmount(difference)}
              </Text>
            </View>

            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>
              Statement Transactions (mark cleared)
            </Text>
            {statementTransactions.length === 0 ? (
              <Text style={{ color: '#64748B', marginBottom: 24 }}>
                No transactions in this statement.
              </Text>
            ) : (
              statementTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  item={t}
                  checked={t.is_reconciled}
                  onToggle={() => handleMarkReconciled(t.id, !t.is_reconciled)}
                />
              ))
            )}

            {suggestions.length > 0 && (
              <TouchableOpacity
                onPress={handleApplySuggestions}
                style={{
                  backgroundColor: '#334155',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: '#3B82F6', textAlign: 'center', fontWeight: '500' }}>
                  Apply {suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginTop: 16, marginBottom: 12 }}>
              Unreconciled Book Transactions
            </Text>
            {unreconciledBookTransactions.length === 0 ? (
              <Text style={{ color: '#64748B', marginBottom: 24 }}>None</Text>
            ) : (
              unreconciledBookTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  item={t}
                  checked={t.is_reconciled}
                  onToggle={() => handleMarkReconciled(t.id, !t.is_reconciled)}
                />
              ))
            )}

            <TouchableOpacity
              onPress={handleComplete}
              disabled={!canComplete || completeReconcil.isPending}
              style={{
                backgroundColor: canComplete ? '#10B981' : '#334155',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              {completeReconcil.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Complete Reconciliation
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
