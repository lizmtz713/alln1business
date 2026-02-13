import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { format, parseISO, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardInsights, useDismissInsight } from '../../src/hooks/useInsights';
import { useBills } from '../../src/hooks/useBills';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useGlobalSearch } from '../../src/hooks/useGlobalSearch';
import { useAppointments } from '../../src/hooks/useAppointments';
import { useVehicles } from '../../src/hooks/useVehicles';
import { useInsurancePolicies } from '../../src/hooks/useInsurance';
import { usePets } from '../../src/hooks/usePets';
import { useHomeServiceContacts } from '../../src/hooks/useHomeServices';
import { hasSupabaseEnv } from '../../src/services/env';
import { Skeleton, EmptyState, ScreenFadeIn } from '../../src/components/ui';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { PredictiveInsights } from '../../src/components/PredictiveInsights';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';
import { getCategoryName } from '../../src/lib/categories';
import { syncBillAndReminderNotifications } from '../../src/services/notificationSchedule';
import type { DashboardInsight } from '../../src/services/insights';
import type { BillWithVendor } from '../../src/types/bills';
import type { DocumentWithRelations } from '../../src/types/documents';

const INSIGHT_ICONS: Record<string, 'trophy' | 'warning' | 'bulb-outline' | 'flash' | 'information-circle'> = {
  win: 'trophy',
  warning: 'warning',
  tip: 'bulb-outline',
  action: 'flash',
  default: 'information-circle',
};

function InsightCard({
  insight,
  onDismiss,
  onCta,
}: {
  insight: DashboardInsight;
  onDismiss: () => void;
  onCta?: () => void;
}) {
  const icon = INSIGHT_ICONS[insight.insight_type] ?? INSIGHT_ICONS.default;
  const colors: Record<string, string> = {
    win: '#10B981',
    warning: '#F59E0B',
    tip: '#3B82F6',
    action: '#8B5CF6',
  };
  const color = colors[insight.insight_type] ?? '#94A3B8';

  return (
    <View className="mb-3 rounded-xl bg-slate-800 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1">
          <View className="mr-3 mt-0.5" style={{ width: 24 }}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-white">{insight.title}</Text>
            <Text className="mt-1 text-sm text-slate-400">{insight.body}</Text>
            {insight.cta_label && insight.cta_route && (
              <TouchableOpacity
                onPress={() => {
                  hapticLight();
                  onCta?.();
                }}
                className="mt-3 self-start rounded-lg px-3 py-1.5"
                style={{ backgroundColor: color + '33', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
              >
                <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{insight.cta_label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            onDismiss();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BarChart({ data }: { data: { category: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <View>
      {data.slice(0, 8).map((d) => (
        <View key={d.category} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, width: 120 }} numberOfLines={1}>
              {getCategoryName(d.category)}
            </Text>
            <View style={{ flex: 1, height: 20, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${(d.total / max) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ color: '#F8FAFC', fontSize: 12, marginLeft: 8, minWidth: 50 }}>
              ${d.total.toFixed(0)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const QUICK_ADD_OPTIONS = [
  { label: 'Add Expense', icon: 'remove', route: '/(modals)/add-expense' as const },
  { label: 'Add Income', icon: 'add', route: '/(modals)/add-income' as const },
  { label: 'Scan Receipt', icon: 'camera', route: '/(modals)/scan-receipt' as const },
  { label: 'Add Bill', icon: 'receipt', route: '/(modals)/add-bill' as const },
  { label: 'Upload Document', icon: 'folder-open', route: '/(modals)/upload-document' as const },
  { label: 'Add Vehicle', icon: 'car', route: '/(modals)/add-vehicle' as const },
  { label: 'Add Pet', icon: 'paw', route: '/(modals)/add-pet' as const },
  { label: 'Add Insurance', icon: 'shield-checkmark', route: '/(modals)/add-insurance' as const },
  { label: 'Add Medical', icon: 'medkit', route: '/(modals)/add-medical' as const },
  { label: 'Add Home Service', icon: 'construct', route: '/(modals)/add-home-service' as const },
  { label: 'Add Appointment', icon: 'calendar', route: '/(modals)/add-appointment' as const },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const name = profile?.full_name || profile?.business_name || user?.email?.split('@')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const queryClient = useQueryClient();
  const { data: insights = [], isLoading: insightsLoading, isError: insightsError, refetch: refetchInsights, isRefetching: insightsRefreshing } = useDashboardInsights();
  const dismissMutation = useDismissInsight();

  const { data: bills = [] } = useBills();
  const { data: documents = [] } = useDocuments();
  const { data: transactions = [] } = useTransactions();
  const { data: appointments = [] } = useAppointments();
  const { data: vehicles = [] } = useVehicles();
  const { data: insurancePolicies = [] } = useInsurancePolicies();
  const { data: pets = [] } = usePets();
  const { data: homeServiceContacts = [] } = useHomeServiceContacts();
  const searchResult = useGlobalSearch(searchQuery);

  const upcomingBills = useMemo(() => {
    const now = new Date();
    const in7 = addDays(now, 7);
    return bills.filter((b) => {
      if (b.status !== 'pending' || !b.due_date) return false;
      try {
        const d = parseISO(b.due_date);
        return d >= now && d <= in7;
      } catch {
        return false;
      }
    });
  }, [bills]);

  const expiringDocuments = useMemo(() => {
    const now = new Date();
    const in30 = addDays(now, 30);
    return documents.filter((d) => {
      if (!d.expiration_date) return false;
      try {
        const ex = parseISO(d.expiration_date);
        return ex >= now && ex <= in30;
      } catch {
        return false;
      }
    });
  }, [documents]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const in14 = addDays(now, 14);
    return appointments
      .filter((a) => {
        try {
          const d = parseISO(a.appointment_date);
          return d >= now && d <= in14;
        } catch {
          return false;
        }
      })
      .sort((a, b) => (a.appointment_date < b.appointment_date ? -1 : 1))
      .slice(0, 5);
  }, [appointments]);

  const expiringInsuranceOrRegistration = useMemo(() => {
    const now = new Date();
    const in30 = addDays(now, 30);
    const vehicleExpiry = vehicles
      .filter((v) => {
        const reg = v.registration_expiry;
        const ins = v.insurance_expiry;
        try {
          if (reg) {
            const d = parseISO(reg);
            if (d >= now && d <= in30) return true;
          }
          if (ins) {
            const d = parseISO(ins);
            if (d >= now && d <= in30) return true;
          }
        } catch {}
        return false;
      })
      .map((v) => ({ type: 'vehicle' as const, item: v, date: v.registration_expiry || v.insurance_expiry }));
    const policyExpiry = insurancePolicies
      .filter((p) => {
        if (!p.renewal_date) return false;
        try {
          const d = parseISO(p.renewal_date);
          return d >= now && d <= in30;
        } catch {
          return false;
        }
      })
      .map((p) => ({ type: 'insurance' as const, item: p, date: p.renewal_date }));
    return [...vehicleExpiry, ...policyExpiry].slice(0, 5);
  }, [vehicles, insurancePolicies]);

  const petsWithVaccination = useMemo(() => pets.filter((p) => p.vaccination_dates && p.vaccination_dates.trim()), [pets]);

  const homeServicesDue = useMemo(() => {
    const sixMonthsAgo = addDays(new Date(), -180);
    return homeServiceContacts
      .filter((h) => {
        if (!h.last_service_date) return true;
        try {
          const d = parseISO(h.last_service_date);
          return d <= sixMonthsAgo;
        } catch {
          return true;
        }
      })
      .slice(0, 3);
  }, [homeServiceContacts]);

  const recentActivity = useMemo(() => transactions.slice(0, 5), [transactions]);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthRange = { start: format(monthStart, 'yyyy-MM-dd'), end: format(monthEnd, 'yyyy-MM-dd') };
  const { data: monthTransactions = [] } = useTransactions({ type: 'expense', dateRange: monthRange });
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions) {
      const cat = t.category ?? 'other';
      map[cat] = (map[cat] ?? 0) + Math.abs(Number(t.amount));
    }
    return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
  }, [monthTransactions]);

  useEffect(() => {
    if (!hasSupabaseEnv || upcomingBills.length === 0) return;
    const billPayload = upcomingBills.map((b) => ({
      id: b.id,
      bill_name: b.bill_name,
      due_date: b.due_date,
      amount: Number(b.amount),
      status: b.status,
    }));
    syncBillAndReminderNotifications(billPayload, []);
  }, [hasSupabaseEnv, upcomingBills.length]);

  const onRefresh = () => {
    refetchInsights();
    queryClient.invalidateQueries({ queryKey: ['predictedInsights'] });
  };

  const showSearchResults = searchQuery.trim().length >= 2;
  const hasSearchResults =
    showSearchResults &&
    (searchResult.bills.length > 0 ||
      searchResult.documents.length > 0 ||
      searchResult.vehicles.length > 0 ||
      searchResult.pets.length > 0 ||
      searchResult.insurancePolicies.length > 0 ||
      searchResult.medicalRecords.length > 0 ||
      searchResult.homeServiceContacts.length > 0 ||
      searchResult.appointments.length > 0);

  const stats = useMemo(() => {
    const income = monthTransactions.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
    const expenses = monthTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return [
      { label: 'This Month Income', value: `$${income.toFixed(0)}`, color: 'text-green-500' },
      { label: 'This Month Expenses', value: `$${expenses.toFixed(0)}`, color: 'text-red-400' },
      { label: 'Profit', value: `$${(income - expenses).toFixed(0)}`, color: 'text-slate-300' },
      { label: 'Upcoming Bills (7d)', value: String(upcomingBills.length), color: 'text-amber-400' },
    ];
  }, [monthTransactions, upcomingBills.length]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <OfflineBanner />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={insightsRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        <ScreenFadeIn>
          <View className="p-4">
            <Text className="text-2xl font-bold text-white">
              {greeting}, {name}
            </Text>
            <Text className="mt-1 text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

            {/* Search bar */}
            <View className="mt-4 flex-row items-center rounded-xl bg-slate-800 px-3" style={{ minHeight: MIN_TOUCH_TARGET + 8 }}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-3 text-white"
                placeholder="Search bills, documents, vehicles, pets..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12}>
                  <Ionicons name="close-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {showSearchResults && (
              <View className="mt-2 rounded-xl bg-slate-800 p-3">
                {searchResult.isLoading ? (
                  <Text className="text-slate-400 text-sm">Searching...</Text>
                ) : searchResult.isError ? (
                  <Text className="text-amber-400 text-sm">Search failed</Text>
                ) : !hasSearchResults ? (
                  <Text className="text-slate-400 text-sm">No results for "{searchQuery.trim()}"</Text>
                ) : (
                  <>
                    {searchResult.bills.map((b) => (
                      <TouchableOpacity
                        key={`b-${b.id}`}
                        onPress={() => { hapticLight(); router.push(`/bill/${b.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{b.bill_name}</Text>
                        <Text className="text-slate-400 text-xs">Bill · ${Number(b.amount).toFixed(2)}</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.documents.map((d) => (
                      <TouchableOpacity
                        key={`d-${d.id}`}
                        onPress={() => { hapticLight(); router.push(`/document/${d.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{d.name}</Text>
                        <Text className="text-slate-400 text-xs">Document</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.vehicles.map((v) => (
                      <TouchableOpacity
                        key={`v-${v.id}`}
                        onPress={() => { hapticLight(); router.push(`/vehicle/${v.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'}</Text>
                        <Text className="text-slate-400 text-xs">Vehicle</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.pets.map((p) => (
                      <TouchableOpacity
                        key={`p-${p.id}`}
                        onPress={() => { hapticLight(); router.push(`/pet/${p.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{p.name}</Text>
                        <Text className="text-slate-400 text-xs">Pet</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.insurancePolicies.map((pol) => (
                      <TouchableOpacity
                        key={`pol-${pol.id}`}
                        onPress={() => { hapticLight(); router.push(`/insurance-policy/${pol.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{pol.provider}</Text>
                        <Text className="text-slate-400 text-xs">Insurance</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.medicalRecords.map((m) => (
                      <TouchableOpacity
                        key={`m-${m.id}`}
                        onPress={() => { hapticLight(); router.push(`/medical/${m.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{m.record_type || m.provider || 'Medical record'}</Text>
                        <Text className="text-slate-400 text-xs">Medical</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.homeServiceContacts.map((h) => (
                      <TouchableOpacity
                        key={`h-${h.id}`}
                        onPress={() => { hapticLight(); router.push(`/home-service/${h.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{h.name}</Text>
                        <Text className="text-slate-400 text-xs">Home service · {h.service_type}</Text>
                      </TouchableOpacity>
                    ))}
                    {searchResult.appointments.map((a) => (
                      <TouchableOpacity
                        key={`a-${a.id}`}
                        onPress={() => { hapticLight(); router.push(`/appointment/${a.id}` as never); }}
                        style={{ paddingVertical: 8, minHeight: MIN_TOUCH_TARGET }}
                      >
                        <Text className="text-white font-medium">{a.title}</Text>
                        <Text className="text-slate-400 text-xs">Appointment · {a.appointment_date}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            {hasSupabaseEnv && !showSearchResults && (
              <>
                {/* Dashboard cards: Upcoming bills, Expiring docs, Recent activity */}
                <View className="mt-6">
                  <Text className="mb-3 text-lg font-semibold text-white">Upcoming bills (7 days)</Text>
                  {upcomingBills.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No bills due in the next 7 days.</Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/add-bill' as never)} className="mt-2">
                        <Text className="text-blue-400 text-sm">Add a bill</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {upcomingBills.slice(0, 3).map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => { hapticLight(); router.push(`/bill/${b.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{b.bill_name}</Text>
                          <Text className="text-slate-400 text-xs">Due {format(parseISO(b.due_date), 'MMM d')} · ${Number(b.amount).toFixed(2)}</Text>
                        </TouchableOpacity>
                      ))}
                      {upcomingBills.length > 3 && (
                        <TouchableOpacity onPress={() => router.push('/(tabs)/documents' as never)} className="py-2">
                          <Text className="text-blue-400 text-sm">View all bills</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Expiring documents (30 days)</Text>
                  {expiringDocuments.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No documents expiring in the next 30 days.</Text>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {expiringDocuments.slice(0, 3).map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          onPress={() => { hapticLight(); router.push(`/document/${d.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{d.name}</Text>
                          <Text className="text-slate-400 text-xs">Expires {d.expiration_date ? format(parseISO(d.expiration_date), 'MMM d') : '—'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Upcoming appointments (14 days)</Text>
                  {upcomingAppointments.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No appointments in the next 14 days.</Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/add-appointment' as never)} className="mt-2">
                        <Text className="text-blue-400 text-sm">Add appointment</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {upcomingAppointments.map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          onPress={() => { hapticLight(); router.push(`/appointment/${a.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{a.title}</Text>
                          <Text className="text-slate-400 text-xs">{a.appointment_date}{a.appointment_time ? ` · ${a.appointment_time}` : ''}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={() => router.push('/appointments' as never)} className="py-2">
                        <Text className="text-blue-400 text-sm">View all appointments</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Expiring insurance / registration (30 days)</Text>
                  {expiringInsuranceOrRegistration.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">Nothing expiring in the next 30 days.</Text>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {expiringInsuranceOrRegistration.map((x) => (
                        <TouchableOpacity
                          key={x.type === 'vehicle' ? `v-${x.item.id}` : `pol-${x.item.id}`}
                          onPress={() => {
                            hapticLight();
                            router.push(x.type === 'vehicle' ? `/vehicle/${x.item.id}` as never : `/insurance-policy/${x.item.id}` as never);
                          }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">
                            {x.type === 'vehicle'
                              ? `${(x.item as import('../../src/types/vehicles').Vehicle).year} ${(x.item as import('../../src/types/vehicles').Vehicle).make} ${(x.item as import('../../src/types/vehicles').Vehicle).model}`.trim() || 'Vehicle'
                              : (x.item as import('../../src/types/insurance').InsurancePolicy).provider}
                          </Text>
                          <Text className="text-slate-400 text-xs">
                            {x.type === 'vehicle' ? 'Vehicle' : 'Insurance'} · Expires {x.date ? format(parseISO(x.date), 'MMM d') : '—'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Pet vaccination reminders</Text>
                  {petsWithVaccination.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No pets with vaccination dates on file.</Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/add-pet' as never)} className="mt-2">
                        <Text className="text-blue-400 text-sm">Add pet</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {petsWithVaccination.slice(0, 3).map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => { hapticLight(); router.push(`/pet/${p.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{p.name}</Text>
                          <Text className="text-slate-400 text-xs">Review vaccination dates</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={() => router.push('/pets' as never)} className="py-2">
                        <Text className="text-blue-400 text-sm">View all pets</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Home service due</Text>
                  {homeServicesDue.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No home services due for review.</Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/add-home-service' as never)} className="mt-2">
                        <Text className="text-blue-400 text-sm">Add home service contact</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {homeServicesDue.map((h) => (
                        <TouchableOpacity
                          key={h.id}
                          onPress={() => { hapticLight(); router.push(`/home-service/${h.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{h.name}</Text>
                          <Text className="text-slate-400 text-xs">{h.service_type} · Last service {h.last_service_date || '—'}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={() => router.push('/home-services' as never)} className="py-2">
                        <Text className="text-blue-400 text-sm">View all home services</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <PredictiveInsights />

                <View className="mt-4">
                  <Text className="mb-3 text-lg font-semibold text-white">Recent activity</Text>
                  {recentActivity.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No recent transactions.</Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/add-expense' as never)} className="mt-2">
                        <Text className="text-blue-400 text-sm">Add expense</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-3">
                      {recentActivity.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => { hapticLight(); router.push(`/(modals)/transaction/${t.id}` as never); }}
                          style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', minHeight: MIN_TOUCH_TARGET }}
                        >
                          <Text className="text-white font-medium">{t.vendor || 'Transaction'}</Text>
                          <Text className="text-slate-400 text-xs">
                            {getCategoryName(t.category)} · {t.amount >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as never)} className="py-2">
                        <Text className="text-blue-400 text-sm">View all transactions</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Monthly spending by category */}
                <View className="mt-6">
                  <Text className="mb-3 text-lg font-semibold text-white">Monthly spending by category</Text>
                  {spendingByCategory.length === 0 ? (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <Text className="text-slate-400 text-sm">No expenses this month yet.</Text>
                    </View>
                  ) : (
                    <View className="rounded-xl bg-slate-800 p-4">
                      <BarChart data={spendingByCategory} />
                    </View>
                  )}
                </View>
              </>
            )}

            {hasSupabaseEnv && (
              <View className="mt-6">
                <Text className="mb-3 text-lg font-semibold text-white">AI Insights</Text>
                {insightsError ? (
                  <View className="rounded-xl bg-slate-800 p-4">
                    <Text className="text-slate-400 text-sm">Insights unavailable.</Text>
                  </View>
                ) : insightsLoading ? (
                  <View className="rounded-xl bg-slate-800 p-6">
                    <Skeleton height={24} style={{ marginBottom: 12 }} />
                    <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
                    <Skeleton height={16} width="60%" />
                  </View>
                ) : insights.length > 0 ? (
                  insights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={() => dismissMutation.mutate(insight.id)}
                      onCta={insight.cta_route ? () => router.push(insight.cta_route as never) : undefined}
                    />
                  ))
                ) : (
                  <EmptyState title="No insights for today" body="Check back later for personalized tips." icon="bulb-outline" />
                )}
              </View>
            )}

            {!hasSupabaseEnv && (
              <View className="mt-6 rounded-xl bg-slate-800 p-4">
                <Text className="text-sm text-slate-400">Connect Supabase to see dashboard cards and insights.</Text>
              </View>
            )}

            <View className="mt-6">
              <Text className="mb-3 text-lg font-semibold text-white">Quick Stats</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                {stats.map((s, i) => (
                  <View key={i} className="mr-3 w-36 rounded-xl bg-slate-800 p-4">
                    <Text className="text-xs text-slate-400">{s.label}</Text>
                    <Text className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View className="mt-8 pb-24">
              <Text className="mb-3 text-lg font-semibold text-white">Quick Actions</Text>
              <View className="flex-row flex-wrap gap-3">
                {QUICK_ADD_OPTIONS.slice(0, 6).map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    className="w-[31%] rounded-xl bg-slate-800 p-4"
                    style={{ minHeight: MIN_TOUCH_TARGET * 2 }}
                    onPress={() => {
                      hapticLight();
                      router.push(a.route as never);
                    }}
                  >
                    <Ionicons name={a.icon as any} size={24} color="#94A3B8" />
                    <Text className="mt-2 text-sm text-white">{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScreenFadeIn>
      </ScrollView>

      {/* Quick-add FAB */}
      <TouchableOpacity
        onPress={() => { hapticLight(); setFabOpen(true); }}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#3B82F6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={fabOpen} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setFabOpen(false)}>
          <Pressable style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }} onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-lg font-semibold text-white">Quick add</Text>
            <View className="flex-row flex-wrap gap-3">
              {QUICK_ADD_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    hapticLight();
                    setFabOpen(false);
                    router.push(opt.route as never);
                  }}
                  style={{
                    width: '31%',
                    backgroundColor: '#334155',
                    borderRadius: 12,
                    padding: 16,
                    minHeight: MIN_TOUCH_TARGET * 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={opt.icon as any} size={22} color="#94A3B8" />
                  <Text className="mt-2 text-xs text-white text-center">{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
