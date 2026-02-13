import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHouseholdMembers } from '../src/hooks/useHouseholdMembers';
import { useCreateAppointment } from '../src/hooks/useAppointments';
import { SmartActionBar } from '../src/components/SmartActionBar';
import { hasSupabaseEnv } from '../src/services/env';
import { format, parseISO } from 'date-fns';
import { hapticLight } from '../src/lib/haptics';

type MemberWithBirthday = { id: string; name: string; relationship: string | null; notes: string | null; birthday?: string | null };

export default function FamilyScreen() {
  const router = useRouter();
  const { data: members = [], isLoading } = useHouseholdMembers();
  const createAppointment = useCreateAppointment();

  const membersWithBirthday = members as MemberWithBirthday[];
  const hasAnyBirthday = membersWithBirthday.some((m) => m.birthday);

  const handleUpdateSizes = useCallback(() => {
    hapticLight();
    router.push('/(tabs)/household' as never);
  }, [router]);

  const handleAddBirthdayToCalendar = useCallback(
    async (member: MemberWithBirthday) => {
      if (!member.birthday) return;
      hapticLight();
      const [y, m, d] = member.birthday.split('-').map(Number);
      const thisYear = new Date().getFullYear();
      const appointmentDate = format(new Date(thisYear, m - 1, d), 'yyyy-MM-dd');
      try {
        await createAppointment.mutateAsync({
          title: `${member.name}'s birthday`,
          appointment_date: appointmentDate,
          appointment_time: null,
          location: null,
          notes: 'Birthday',
        });
        Alert.alert('Added', `${member.name}'s birthday added to your calendar.`);
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
    [createAppointment]
  );

  const handleShareProfile = useCallback((member: MemberWithBirthday) => {
    hapticLight();
    const lines = [
      member.name,
      member.relationship ? `Relationship: ${member.relationship}` : null,
      member.notes ? `Notes: ${member.notes}` : null,
    ].filter(Boolean);
    Share.share({
      message: lines.join('\n'),
      title: `${member.name} – Emergency contact`,
    }).catch(() => {});
  }, []);

  if (!hasSupabaseEnv) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.muted}>Connect Supabase to manage family.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Family</Text>
      <Text style={styles.subtitle}>Household members and quick actions.</Text>

      <SmartActionBar
        title="Quick actions"
        actions={[
          {
            id: 'update-sizes',
            label: 'Update Sizes',
            icon: 'resize-outline',
            onPress: handleUpdateSizes,
          },
        ]}
      />

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : members.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>No household members yet.</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/voice-onboarding' as never)}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>Add with voice</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {membersWithBirthday.map((member) => (
            <View key={member.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{member.name}</Text>
                {member.relationship ? (
                  <Text style={styles.relationship}>{member.relationship}</Text>
                ) : null}
                {member.birthday ? (
                  <Text style={styles.birthday}>
                    Birthday: {format(parseISO(member.birthday), 'MMM d')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.actionsRow}>
                {member.birthday && (
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => handleAddBirthdayToCalendar(member)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                    <Text style={styles.smallBtnText}>Add to Calendar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => handleShareProfile(member)}
                >
                  <Ionicons name="share-outline" size={18} color="#3B82F6" />
                  <Text style={styles.smallBtnText}>Share Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#94A3B8', fontSize: 14, marginBottom: 20 },
  muted: { color: '#94A3B8', fontSize: 14 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: { marginBottom: 12 },
  name: { color: '#F8FAFC', fontSize: 18, fontWeight: '600' },
  relationship: { color: '#94A3B8', fontSize: 14, marginTop: 2 },
  birthday: { color: '#A5B4FC', fontSize: 13, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  smallBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '500' },
  addBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  addBtnText: { color: '#0F172A', fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingBottom: 40 },
});
