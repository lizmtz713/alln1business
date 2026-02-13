import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInsurancePolicy, useDeleteInsurancePolicy } from '../../src/hooks/useInsurance';
import { hasSupabaseEnv } from '../../src/services/env';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';
import { format, parseISO, isValid } from 'date-fns';

function safeDate(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    const d = parseISO(s);
    return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{typeof value === 'number' ? (label.includes('amount') || label.includes('premium') ? '$' + value.toFixed(2) : String(value)) : value}</Text>
    </View>
  );
}

export default function InsurancePolicyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Array.isArray(id) ? id[0] : id;
  const { data: pol, isLoading } = useInsurancePolicy(pid);
  const deletePolicy = useDeleteInsurancePolicy();

  const handleDelete = () => {
    Alert.alert('Delete policy', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (!pid) return;
        try {
          await deletePolicy.mutateAsync(pid);
          router.back();
        } catch (e) {
          Alert.alert('Error', (e as Error).message);
        }
      } },
    ]);
  };

  if (!hasSupabaseEnv || !id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#3B82F6' }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase.</Text>
      </View>
    );
  }
  if (isLoading || !pol) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F172A' }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{pol.provider}</Text>
      <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Row label="Policy number" value={pol.policy_number} />
        <Row label="Type" value={pol.policy_type} />
        <Row label="Premium" value={pol.premium_amount != null ? Number(pol.premium_amount) : null} />
        <Row label="Frequency" value={pol.premium_frequency} />
        <Row label="Renewal date" value={safeDate(pol.renewal_date)} />
        <Row label="Notes" value={pol.notes} />
      </View>
      <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/edit-insurance/' + pol.id as never); }} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '500' }}>Delete</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
