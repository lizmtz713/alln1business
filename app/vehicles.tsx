import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useVehicles } from '../src/hooks/useVehicles';
import { hasSupabaseEnv } from '../src/services/env';
import { hapticLight } from '../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../src/lib/constants';
import type { Vehicle } from '../src/types/vehicles';
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

function VehicleCard({ v, onPress }: { v: Vehicle; onPress: () => void }) {
  const label = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onPress(); }}
      style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET }}
    >
      <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{label}</Text>
      {v.vin && <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>VIN: {v.vin}</Text>}
      {(v.insurance_expiry || v.registration_expiry) && (
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
          Insurance: {safeDate(v.insurance_expiry)} · Reg: {safeDate(v.registration_expiry)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function VehiclesScreen() {
  const router = useRouter();
  const { data: list = [], isLoading, refetch, isRefetching } = useVehicles();

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>Vehicles</Text>
        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Connect Supabase to manage vehicles.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#3B82F6" />}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Vehicles</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No vehicles yet</Text>
            <TouchableOpacity
              onPress={() => { hapticLight(); router.push('/(modals)/add-vehicle' as never); }}
              style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {list.map((v) => (
              <VehicleCard key={v.id} v={v} onPress={() => router.push(`/vehicle/${v.id}` as never)} />
            ))}
            <TouchableOpacity
              onPress={() => { hapticLight(); router.push('/(modals)/add-vehicle' as never); }}
              style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Vehicle</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
