import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useInsurancePolicies } from '../src/hooks/useInsurance';
import { hasSupabaseEnv } from '../src/services/env';
import { hapticLight } from '../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../src/lib/constants';
import type { InsurancePolicy } from '../src/types/insurance';

function PolicyCard({ pol, onPress }: { pol: InsurancePolicy; onPress: () => void }) {
  const renew = pol.renewal_date ? pol.renewal_date.slice(0, 10) : '—';
  return (
    <TouchableOpacity onPress={() => { hapticLight(); onPress(); }} style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET }}>
      <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{pol.provider}</Text>
      <Text style={{ color: '#94A3B8', fontSize: 14 }}>{pol.policy_type || '—'} · Renews {renew}</Text>
      {pol.premium_amount != null && <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>${Number(pol.premium_amount).toFixed(2)} {pol.premium_frequency || ''}</Text>}
    </TouchableOpacity>
  );
}

export default function InsuranceScreen() {
  const router = useRouter();
  const { data: list = [], isLoading, refetch, isRefetching } = useInsurancePolicies();
  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#3B82F6' }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>Insurance</Text>
        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Connect Supabase.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#3B82F6" />}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Insurance</Text>
        {isLoading ? <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} /> : list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No policies yet</Text>
            <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/add-insurance' as never); }} style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Policy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {list.map((pol) => <PolicyCard key={pol.id} pol={pol} onPress={() => router.push('/insurance-policy/' + pol.id as never)} />)}
            <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/add-insurance' as never); }} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Policy</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
