import { View, Text, ScrollView } from 'react-native';
import { colors, spacing, fontSize } from '../../src/lib/constants';
import { Card } from '../../src/components/ui';

export default function AlertsScreen() {
  const alerts = [
    { type: 'urgent', icon: '🚨', title: 'Car registration expires in 5 days', time: '2h ago' },
    { type: 'warning', icon: '⚠️', title: 'Electric bill due tomorrow', time: '5h ago' },
    { type: 'info', icon: '💡', title: 'Tip: You can save $50/mo by switching...', time: '1d ago' },
    { type: 'reminder', icon: '⏰', title: 'Doctor appointment tomorrow at 2pm', time: '1d ago' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xxl }}>
          Alerts
        </Text>

        {alerts.map((alert, i) => (
          <Card key={i} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 24, marginRight: spacing.md }}>{alert.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.base, color: colors.text, fontWeight: '500' }}>
                  {alert.title}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs }}>
                  {alert.time}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
