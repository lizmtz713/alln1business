import { View, Text } from 'react-native';
import { colors, spacing, fontSize } from '../../src/lib/constants';

export default function add-insuranceScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl }}>
      <Text style={{ fontSize: fontSize.xl, color: colors.text }}>
        add-insurance - Coming Soon
      </Text>
    </View>
  );
}
