import { TextInput, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: fontSize.sm,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[
          {
            backgroundColor: colors.surfaceAlt,
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
      {error && (
        <Text
          style={{
            color: colors.error,
            fontSize: fontSize.xs,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
