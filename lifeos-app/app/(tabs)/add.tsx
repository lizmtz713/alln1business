import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, borderRadius, categoryConfig } from '../../src/lib/constants';

export default function AddScreen() {
  const router = useRouter();

  const addOptions = [
    { icon: '💳', label: 'Bill', route: '/(modals)/add-bill' },
    { icon: '🛡️', label: 'Insurance', route: '/(modals)/add-insurance' },
    { icon: '🚗', label: 'Vehicle', route: '/(modals)/add-vehicle' },
    { icon: '👤', label: 'Family Member', route: '/(modals)/add-person' },
    { icon: '🏥', label: 'Medical Provider', route: '/(modals)/add-medical' },
    { icon: '🐕', label: 'Pet', route: '/(modals)/add-pet' },
    { icon: '📅', label: 'Appointment', route: '/(modals)/add-appointment' },
    { icon: '📄', label: 'Document', route: '/(modals)/add-document' },
    { icon: '👥', label: 'Contact', route: '/(modals)/add-contact' },
    { icon: '🏠', label: 'Home Service', route: '/(modals)/add-service' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xxl }}>
          What would you like to add?
        </Text>

        <View style={{ gap: spacing.md }}>
          {addOptions.map((option, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(option.route as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
              }}
            >
              <Text style={{ fontSize: 28, marginRight: spacing.lg }}>{option.icon}</Text>
              <Text style={{ fontSize: fontSize.lg, color: colors.text }}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
