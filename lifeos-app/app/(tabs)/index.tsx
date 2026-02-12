import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { Card } from '../../src/components/ui';
import { colors, spacing, fontSize, borderRadius, categoryConfig } from '../../src/lib/constants';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const todayItems = [
    { icon: '💳', text: 'Electric bill due', color: colors.warning },
    { icon: '🏥', text: 'Doctor appointment 2pm', color: colors.info },
    { icon: '🐕', text: 'Dog grooming reminder', color: colors.success },
  ];

  const needsAttention = [
    { icon: '🚗', text: 'Car registration expires in 5 days', urgent: true },
    { icon: '💳', text: 'Costco membership expiring', urgent: false },
    { icon: '🐕', text: 'Running low on dog food', urgent: false },
  ];

  const quickActions = [
    { icon: '💳', label: 'Add Bill', route: '/(modals)/add-bill' },
    { icon: '📄', label: 'Add Doc', route: '/(modals)/add-document' },
    { icon: '👤', label: 'Add Person', route: '/(modals)/add-person' },
    { icon: '🐕', label: 'Add Pet', route: '/(modals)/add-pet' },
    { icon: '🚗', label: 'Add Vehicle', route: '/(modals)/add-vehicle' },
    { icon: '🏥', label: 'Add Appt', route: '/(modals)/add-appointment' },
  ];

  const modules = Object.entries(categoryConfig).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text }}>
            {greeting}, {name} 👋
          </Text>
          <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginTop: spacing.xs }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>

        {/* Today's Overview */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            📋 Today
          </Text>
          <Card>
            {todayItems.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: i < todayItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
                <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.base }}>{item.text}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
              </View>
            ))}
          </Card>
        </View>

        {/* Needs Attention */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            ⚠️ Needs Attention
          </Text>
          <Card>
            {needsAttention.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: i < needsAttention.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
                <Text style={{ flex: 1, color: item.urgent ? colors.warning : colors.text, fontSize: fontSize.base }}>
                  {item.text}
                </Text>
                {item.urgent && <Ionicons name="alert-circle" size={18} color={colors.warning} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            ⚡ Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push(action.route as any)}
                style={{
                  width: '30%',
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>{action.icon}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modules Overview */}
        <View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            📂 Your Life
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {modules.map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={{
                  width: '47%',
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  borderLeftWidth: 4,
                  borderLeftColor: config.color,
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>{config.icon}</Text>
                <Text style={{ fontSize: fontSize.base, fontWeight: '600', color: colors.text }}>
                  {config.name}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>0 items</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
