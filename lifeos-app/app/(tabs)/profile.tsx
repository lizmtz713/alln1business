import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/constants';
import { Card, Button } from '../../src/components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const menuItems = [
    { icon: 'person-outline', label: 'Household Settings', route: '/settings/household' },
    { icon: 'people-outline', label: 'Family Members', route: '/settings/members' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/settings/notifications' },
    { icon: 'shield-outline', label: 'Privacy & Security', route: '/settings/privacy' },
    { icon: 'cloud-outline', label: 'Backup & Sync', route: '/settings/backup' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/settings/help' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {/* Profile Header */}
        <Card style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text }}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>
            {profile?.household_name || 'My Household'}
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textDim, marginTop: spacing.xs }}>
            {user?.email}
          </Text>
        </Card>

        {/* Menu Items */}
        <View style={{ marginBottom: spacing.xxl }}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Ionicons name={item.icon as any} size={22} color={colors.textMuted} style={{ marginRight: spacing.lg }} />
              <Text style={{ flex: 1, fontSize: fontSize.base, color: colors.text }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <Button title="Sign Out" variant="outline" onPress={signOut} />
      </ScrollView>
    </View>
  );
}
