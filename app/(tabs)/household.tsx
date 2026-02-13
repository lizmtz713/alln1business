import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../src/hooks/useVehicles';
import { usePets } from '../../src/hooks/usePets';
import { useInsurancePolicies } from '../../src/hooks/useInsurance';
import { useMedicalRecords } from '../../src/hooks/useMedical';
import { hasSupabaseEnv } from '../../src/services/env';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';

type Section = {
  id: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
};

export default function MyHouseholdScreen() {
  const router = useRouter();
  const { data: vehicles = [], isLoading: vLoading, refetch: refetchV } = useVehicles();
  const { data: pets = [], isLoading: pLoading, refetch: refetchP } = usePets();
  const { data: policies = [], isLoading: iLoading, refetch: refetchI } = useInsurancePolicies();
  const { data: medical = [], isLoading: mLoading, refetch: refetchM } = useMedicalRecords();

  const sections: Section[] = [
    { id: 'vehicles', label: 'Vehicles', path: '/vehicles', icon: 'car', count: vehicles.length },
    { id: 'pets', label: 'Pets', path: '/pets', icon: 'paw', count: pets.length },
    { id: 'insurance', label: 'Insurance Policies', path: '/insurance', icon: 'shield-checkmark', count: policies.length },
    { id: 'medical', label: 'Medical Records', path: '/medical', icon: 'medkit', count: medical.length },
  ];

  const loading = vLoading || pLoading || iLoading || mLoading;
  const onRefresh = () => {
    refetchV();
    refetchP();
    refetchI();
    refetchM();
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>My Household</Text>
        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Connect Supabase to manage your household.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>My Household</Text>
      <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 4 }}>Manage vehicles, pets, insurance, and medical records.</Text>

      <View style={{ marginTop: 24 }}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => {
              hapticLight();
              router.push(section.path as never);
            }}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: MIN_TOUCH_TARGET,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Ionicons name={section.icon} size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600' }}>{section.label}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                {section.count} {section.count === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
