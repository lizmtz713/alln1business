import { View, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: variant === 'default' ? 1 : 0,
          borderColor: colors.border,
        },
        variant === 'elevated' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
