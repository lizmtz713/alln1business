import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHomeServiceContact, useDeleteHomeServiceContact } from '../../src/hooks/useHomeServices';
import { hasSupabaseEnv } from '../../src/services/env';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{value}</Text>
    </View>
  );
}

export default function HomeServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Array.isArray(id) ? id[0] : id;
  const { data: p, isLoading } = useHomeServiceContact(pid);
  const deleteContact = useDeleteHomeServiceContact();

  const handleDelete = () => {
    Alert.alert('Delete contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!pid) return;
          try {
            await deleteContact.mutateAsync(pid);
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
  if (isLoading || !p) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F172A' }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}><Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text></TouchableOpacity>
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{p.name}</Text>
      <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Row label="Service type" value={p.service_type} />
        <Row label="Phone" value={p.phone} />
        <Row label="Email" value={p.email} />
        <Row label="Last service date" value={p.last_service_date} />
        <Row label="Notes" value={p.notes} />
      </View>
      <TouchableOpacity onPress={() => { hapticLight(); router.push('/(modals)/edit-home-service/' + p.id as never); }} style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '500' }}>Delete</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
