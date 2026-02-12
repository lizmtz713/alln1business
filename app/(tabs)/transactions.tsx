import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../src/hooks/useTransactions';
import { hasSupabaseEnv } from '../../src/services/env';
import { getCategoryName } from '../../src/lib/categories';
import type { Transaction } from '../../src/types/transactions';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

type FilterType = 'all' | 'income' | 'expense';
type ReconciledFilter = 'all' | 'reconciled' | 'unreconciled';

function groupByDate(transactions: Transaction[]): { label: string; data: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const d = t.date?.split('T')[0] ?? '';
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  }
  const sorted = Object.entries(groups).sort(
    ([a], [b]) => (b > a ? 1 : -1)
  );
  return sorted.map(([date, data]) => {
    const parsed = parseISO(date);
    let label = date;
    if (isToday(parsed)) label = 'Today';
    else if (isYesterday(parsed)) label = 'Yesterday';
    else label = format(parsed, 'MMM d, yyyy');
    return { label, data };
  });
}

function TransactionRow({
  item,
  onPress,
}: {
  item: Transaction;
  onPress: () => void;
}) {
  const isIncome = item.amount >= 0;
  const amountStr = isIncome
    ? `+$${Math.abs(item.amount).toFixed(2)}`
    : `-$${Math.abs(item.amount).toFixed(2)}`;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#1E293B',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#F8FAFC',
            fontWeight: '600',
            fontSize: 16,
          }}
          numberOfLines={1}
        >
          {item.vendor || 'Unknown'}
        </Text>
        <Text
          style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}
          numberOfLines={1}
        >
          {getCategoryName(item.category)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            color: isIncome ? '#10B981' : '#EF4444',
            fontWeight: '600',
            fontSize: 15,
          }}
        >
          {amountStr}
        </Text>
        {item.is_reconciled && (
          <Text style={{ color: '#10B981', fontSize: 10, marginTop: 2 }}>✓ Reconciled</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [reconciledFilter, setReconciledFilter] = useState<ReconciledFilter>('all');
  const [fabOpen, setFabOpen] = useState(false);

  const filters = useMemo(
    () => ({
      type: typeFilter === 'all' ? undefined : typeFilter,
      reconciled:
        reconciledFilter === 'all'
          ? undefined
          : reconciledFilter === 'reconciled',
    }),
    [typeFilter, reconciledFilter]
  );

  const { data: transactions = [], isLoading, refetch, isRefetching } = useTransactions(filters);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase().trim();
    return transactions.filter(
      (t) =>
        (t.vendor ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const renderSection = ({
    item: section,
  }: {
    item: { label: string; data: Transaction[] };
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: '#94A3B8',
          fontSize: 14,
          fontWeight: '600',
          marginHorizontal: 16,
          marginBottom: 8,
        }}
      >
        {section.label}
      </Text>
      {section.data.map((tx) => (
        <TransactionRow
          key={tx.id}
          item={tx}
          onPress={() =>
            router.push(
              `/(modals)/transaction/${tx.id}` as never
            )
          }
        />
      ))}
    </View>
  );

  if (!hasSupabaseEnv) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '600' }}>
          Transactions
        </Text>
        <Text
          style={{
            color: '#94A3B8',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          Connect Supabase in .env.local to view transactions.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>
          Transactions
        </Text>

        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by vendor or description..."
          placeholderTextColor="#64748B"
        />

        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'income', 'expense'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: typeFilter === t ? '#3B82F6' : '#1E293B',
              }}
            >
              <Text
                style={{
                  color: typeFilter === t ? '#fff' : '#94A3B8',
                  fontSize: 14,
                }}
              >
                {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'reconciled', 'unreconciled'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setReconciledFilter(r)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: reconciledFilter === r ? '#334155' : '#1E293B',
              }}
            >
              <Text
                style={{
                  color: reconciledFilter === r ? '#fff' : '#94A3B8',
                  fontSize: 14,
                }}
              >
                {r === 'all' ? 'All' : r === 'reconciled' ? 'Reconciled' : 'Unreconciled'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : grouped.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text style={{ color: '#94A3B8', textAlign: 'center' }}>
            No transactions yet.{'\n'}Tap + to add an expense or income.
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.label}
          renderItem={renderSection}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
            />
          }
        />
      )}

      <TouchableOpacity
        onPress={() => setFabOpen(true)}
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#3B82F6',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600' }}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={fabOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFabOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setFabOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#1E293B',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 24,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Add Transaction
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFabOpen(false);
                router.push('/(modals)/add-expense' as never);
              }}
              style={{
                backgroundColor: '#334155',
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 16 }}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFabOpen(false);
                router.push('/(modals)/add-income' as never);
              }}
              style={{
                backgroundColor: '#334155',
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 16 }}>Add Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFabOpen(false);
                router.push('/(modals)/upload-statement' as never);
              }}
              style={{
                backgroundColor: '#334155',
                padding: 16,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 16 }}>Upload Statement</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
