import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useHomeServiceContacts } from '../src/hooks/useHomeServices';
import { hasSupabaseEnv } from '../src/services/env';
import { hapticLight } from '../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../src/lib/constants';
import type { HomeServiceContact } from '../src/types/homeServices';

function ContactCard({ c, onPress }: { c: HomeServiceContact; onPress: () => void }) {
  const last = c.last_service_date ? c.last_service_date.slice(0, 10) : '—';
  return (
    <TouchableOpacity onPress={() => { hapticLight(); onPress(); }} style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET }}>
      <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{c.name}</Text>
      <Text style={{ color: '#94A3B8', fontSize: 14 }}>{c.service_type} · Last service {last}</Text>
      {c.phone ? <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>{c.phone}</Text> : null}
    </TouchableOpacity>
  );
}

export default function HomeServicesScreen() {
  const router = useRouter();
  const { data: list = [], isLoading, refetch, isRefetching } = useHomeServiceContacts();
  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#3B82F6' }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>Home Services</Text>
        <Text style={{ color: '#94A3B8', marginTop: 8 }}>Connect Supabase.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#3B82F6" />}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Home Services</Text>
        {isLoading ? <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} /> : list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No contacts yet</Text>
            <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/add-home-service' as never); }} style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {list.map((c) => <ContactCard key={c.id} c={c} onPress={() => router.push('/home-service/' + c.id as never)} />)}
            <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/add-home-service' as never); }} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Contact</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
