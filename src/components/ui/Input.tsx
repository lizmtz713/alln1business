import { TextInput, TextInputProps, View, Text } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/constants';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: object;
};

export function Input({ label, error, containerStyle, style, placeholderTextColor = colors.textDim, ...props }: Props) {
  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm }}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={placeholderTextColor}
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            color: colors.text,
            fontSize: fontSize.base,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={{ color: colors.error, fontSize: fontSize.xs, marginTop: spacing.xs }}>{error}</Text>}
    </View>
  );
}
