import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../lib/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.accent, text: '#FFFFFF' },
  secondary: { bg: colors.surfaceAlt, text: colors.text },
  outline: { bg: 'transparent', text: colors.accent, border: colors.accent },
  ghost: { bg: 'transparent', text: colors.textMuted },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { bg, text, border } = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          borderWidth: border ? 2 : 0,
          borderColor: border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text style={[{ color: text, fontSize: fontSize.base, fontWeight: '600' }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
