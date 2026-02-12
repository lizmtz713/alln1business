import { View } from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/constants';

type Props = {
  children: React.ReactNode;
  style?: object;
};

export function Card({ children, style }: Props) {
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
