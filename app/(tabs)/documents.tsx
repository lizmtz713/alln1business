import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useBills,
  useBillStats,
  isOverdue,
  isDueSoon,
} from '../../src/hooks/useBills';
import { useDocuments } from '../../src/hooks/useDocuments';
import { hasSupabaseEnv } from '../../src/services/env';
import { EmptyState } from '../../src/components/ui';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';
import type { BillWithVendor } from '../../src/types/bills';
import type { DocumentWithRelations } from '../../src/types/documents';
import { format, parseISO, isValid } from 'date-fns';

function safeFormatDate(s: string | null | undefined, fmt: string): string {
  if (!s) return '—';
  try {
    const d = parseISO(s);
    return isValid(d) ? format(d, fmt) : '—';
  } catch {
    return '—';
  }
}

type DocSegment = 'all' | 'bills' | 'contracts' | 'forms';

const SEGMENTS: { id: DocSegment; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bills', label: 'Bills' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'forms', label: 'Forms' },
];

const BILL_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#94A3B8',
};

const BillStatusBadge = React.memo(function BillStatusBadge({ bill }: { bill: BillWithVendor }) {
  const displayStatus = isOverdue(bill) ? 'overdue' : bill.status;
  const color = BILL_STATUS_COLORS[displayStatus] ?? '#64748B';
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500', textTransform: 'capitalize' }}>
        {displayStatus}
      </Text>
    </View>
  );
});

const DocumentCard = React.memo(function DocumentCard({
  doc,
  onPress,
}: {
  doc: DocumentWithRelations;
  onPress: () => void;
}) {
  const subtitle = doc.description ?? null;

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: MIN_TOUCH_TARGET,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
            {doc.name}
          </Text>
          {subtitle && (
            <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={{ backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ color: '#94A3B8', fontSize: 11, textTransform: 'capitalize' }}>
            {(doc.doc_type ?? 'document').replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>
        {safeFormatDate(doc.created_at, 'MMM d, yyyy')}
      </Text>
    </TouchableOpacity>
  );
});

const BillCard = React.memo(function BillCard({
  bill,
  onPress,
}: {
  bill: BillWithVendor;
  onPress: () => void;
}) {
  const providerName = bill.provider_name || '—';

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: MIN_TOUCH_TARGET,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{bill.bill_name}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }} numberOfLines={1}>
            {providerName}
          </Text>
        </View>
        <BillStatusBadge bill={bill} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 16 }}>
          ${Number(bill.amount).toFixed(2)}
        </Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>
          Due {safeFormatDate(bill.due_date, 'MMM d, yyyy')}
        </Text>
      </View>
      {bill.payment_url && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (bill.payment_url) Linking.openURL(bill.payment_url);
          }}
          style={{ marginTop: 8 }}
        >
          <Text style={{ color: '#3B82F6', fontSize: 12 }}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

export default function DocumentsScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<DocSegment>('bills');
  const [search, setSearch] = useState('');

  const { data: bills = [], isLoading: billsLoading, refetch: refetchBills, isRefetching: billsRefreshing } = useBills({
    search: segment === 'bills' && search ? search : undefined,
  });
  const { data: billStats = { due_soon: 0, overdue: 0, paid: 0 } } = useBillStats();

  const { data: contracts = [], isLoading: contractsLoading, refetch: refetchContracts } = useDocuments({
    segment: 'contracts',
    search: segment === 'contracts' && search ? search : undefined,
  });
  const { data: forms = [], isLoading: formsLoading, refetch: refetchForms } = useDocuments({
    segment: 'forms',
    search: segment === 'forms' && search ? search : undefined,
  });

  const billsGrouped = useMemo(() => {
    const overdue: BillWithVendor[] = [];
    const dueThisWeek: BillWithVendor[] = [];
    const upcoming: BillWithVendor[] = [];
    const paid: BillWithVendor[] = [];
    for (const b of bills) {
      if (b.status === 'paid') paid.push(b);
      else if (isOverdue(b)) overdue.push(b);
      else if (isDueSoon(b)) dueThisWeek.push(b);
      else upcoming.push(b);
    }
    return { overdue, dueThisWeek, upcoming, paid };
  }, [bills]);

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>Documents</Text>
        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Connect Supabase for documents.</Text>
      </View>
    );
  }

  const handleRefresh = () => {
    refetchBills();
    refetchContracts();
    refetchForms();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={billsRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Documents
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {SEGMENTS.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => {
                hapticLight();
                setSegment(s.id);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: segment === s.id ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontWeight: '500' }}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {segment === 'all' && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>
              Bills
            </Text>
            {bills.length === 0 ? (
              <Text style={{ color: '#64748B', marginBottom: 16 }}>No bills</Text>
            ) : (
              bills.slice(0, 3).map((b) => (
                <BillCard key={b.id} bill={b} onPress={() => router.push(`/bill/${b.id}` as never)} />
              ))
            )}
            <TouchableOpacity
              onPress={() => router.push('/(modals)/add-bill' as never)}
              style={{ backgroundColor: '#334155', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#3B82F6' }}>Add Bill</Text>
            </TouchableOpacity>
            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
              Contracts
            </Text>
            {contracts.length === 0 ? (
              <Text style={{ color: '#64748B', marginBottom: 16 }}>No contracts</Text>
            ) : (
              contracts.slice(0, 3).map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  onPress={() => router.push(`/document/${d.id}` as never)}
                />
              ))
            )}
            <TouchableOpacity
              onPress={() => router.push('/(modals)/upload-document' as never)}
              style={{ backgroundColor: '#334155', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#3B82F6' }}>Upload Document</Text>
            </TouchableOpacity>
            <Text style={{ color: '#F8FAFC', fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
              Forms
            </Text>
            {forms.length === 0 ? (
              <Text style={{ color: '#64748B' }}>No forms</Text>
            ) : (
              forms.slice(0, 3).map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  onPress={() => router.push(`/document/${d.id}` as never)}
                />
              ))
            )}
          </View>
        )}

        {segment === 'bills' && (
          <>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Due Soon</Text>
                <Text style={{ color: '#F59E0B', fontWeight: '600', fontSize: 18 }}>{billStats.due_soon}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Overdue</Text>
                <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 18 }}>{billStats.overdue}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Paid</Text>
                <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 18 }}>{billStats.paid}</Text>
              </View>
            </View>
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
              placeholder="Search bills..."
              placeholderTextColor="#64748B"
            />
            {billsLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
            ) : bills.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No bills yet</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/add-bill' as never)}
                  style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Add Bill</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {billsGrouped.overdue.length > 0 && (
                  <>
                    <Text style={{ color: '#EF4444', fontWeight: '600', marginBottom: 8, marginTop: 8 }}>OVERDUE</Text>
                    {billsGrouped.overdue.map((b) => (
                      <BillCard key={b.id} bill={b} onPress={() => router.push(`/bill/${b.id}` as never)} />
                    ))}
                  </>
                )}
                {billsGrouped.dueThisWeek.length > 0 && (
                  <>
                    <Text style={{ color: '#F59E0B', fontWeight: '600', marginBottom: 8, marginTop: 16 }}>DUE THIS WEEK</Text>
                    {billsGrouped.dueThisWeek.map((b) => (
                      <BillCard key={b.id} bill={b} onPress={() => router.push(`/bill/${b.id}` as never)} />
                    ))}
                  </>
                )}
                {billsGrouped.upcoming.length > 0 && (
                  <>
                    <Text style={{ color: '#94A3B8', fontWeight: '600', marginBottom: 8, marginTop: 16 }}>UPCOMING</Text>
                    {billsGrouped.upcoming.map((b) => (
                      <BillCard key={b.id} bill={b} onPress={() => router.push(`/bill/${b.id}` as never)} />
                    ))}
                  </>
                )}
                {billsGrouped.paid.length > 0 && (
                  <>
                    <Text style={{ color: '#10B981', fontWeight: '600', marginBottom: 8, marginTop: 16 }}>PAID</Text>
                    {billsGrouped.paid.map((b) => (
                      <BillCard key={b.id} bill={b} onPress={() => router.push(`/bill/${b.id}` as never)} />
                    ))}
                  </>
                )}
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/add-bill' as never)}
                  style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Bill</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {segment === 'contracts' && (
          <>
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
              placeholder="Search documents..."
              placeholderTextColor="#64748B"
            />
            {contractsLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
            ) : contracts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No contracts yet</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/upload-document' as never)}
                  style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Upload Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {contracts.map((d) => (
                  <DocumentCard
                    key={d.id}
                    doc={d}
                    onPress={() => router.push(`/document/${d.id}` as never)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {segment === 'forms' && (
          <>
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
              placeholder="Search documents..."
              placeholderTextColor="#64748B"
            />
            {formsLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
            ) : forms.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No forms yet</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/upload-document' as never)}
                  style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Upload Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              forms.map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  onPress={() => router.push(`/document/${d.id}` as never)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {(segment === 'contracts' || segment === 'forms') && (
        <TouchableOpacity
          onPress={() => router.push('/(modals)/upload-document' as never)}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#3B82F6',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
