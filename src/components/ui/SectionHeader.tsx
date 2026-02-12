import { View, Text } from 'react-native';
import { colors, spacing, fontSize } from '../../lib/constants';

type Props = { title: string; style?: object };

export function SectionHeader({ title, style }: Props) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      <Text style={{ color: colors.text, fontSize: fontSize.lg, fontWeight: '600' }}>{title}</Text>
    </View>
  );
}
