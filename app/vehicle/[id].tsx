import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVehicle, useDeleteVehicle } from '../../src/hooks/useVehicles';
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

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: v, isLoading } = useVehicle(Array.isArray(id) ? id[0] : id);
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = () => {
    Alert.alert('Delete vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const vehicleId = Array.isArray(id) ? id[0] : id;
          if (!vehicleId) return;
          try {
            await deleteVehicle.mutateAsync(vehicleId);
            router.back();
          } catch (e) {
            Alert.alert('Error', (e as Error).message);
          }
        },
      },
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

  if (isLoading || !v) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const label = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F172A' }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{label}</Text>
      <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Row label="VIN" value={v.vin} />
        <Row label="Insurance provider" value={v.insurance_provider} />
        <Row label="Insurance expiry" value={safeDate(v.insurance_expiry)} />
        <Row label="Registration expiry" value={safeDate(v.registration_expiry)} />
        {v.notes ? <Row label="Notes" value={v.notes} /> : null}
      </View>
      <TouchableOpacity onPress={() => { hapticLight(); router.push(`/(modals)/edit-vehicle/${v.id}` as never); }} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '500' }}>Delete</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{value}</Text>
    </View>
  );
}
