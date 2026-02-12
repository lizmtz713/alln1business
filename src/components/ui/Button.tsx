import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/constants';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: colors.primary, text: '#fff' },
  secondary: { bg: colors.surfaceAlt, text: colors.text },
  ghost: { bg: 'transparent', text: colors.primary },
  destructive: { bg: colors.error, text: '#fff' },
};

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  textStyle?: object;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: Props) {
  const { bg, text } = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <Text style={[{ color: text, fontSize: fontSize.base, fontWeight: '600' }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
