import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../lib/constants';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: Props) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
        paddingHorizontal: spacing.xxl,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.error + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
      </View>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: fontSize.sm,
          textAlign: 'center',
          marginBottom: onRetry ? spacing.lg : 0,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            backgroundColor: colors.surfaceAlt,
            borderRadius: 12,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.sm }}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
