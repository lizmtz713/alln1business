import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, MIN_TOUCH_TARGET } from '../../lib/constants';
import { hapticLight } from '../../lib/haptics';

type Props = {
  title: string;
  body?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  ctaLabel?: string;
  onPress?: () => void;
};

const DEFAULT_ICON = 'document-outline';

export function EmptyState({
  title,
  body,
  icon = DEFAULT_ICON,
  ctaLabel,
  onPress,
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
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: fontSize.base,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: body ? spacing.sm : 0,
        }}
      >
        {title}
      </Text>
      {body && (
        <Text
          style={{
            color: colors.textDim,
            fontSize: fontSize.sm,
            textAlign: 'center',
            marginBottom: ctaLabel ? spacing.lg : 0,
          }}
        >
          {body}
        </Text>
      )}
      {ctaLabel && onPress && (
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            onPress();
          }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.md,
            minHeight: MIN_TOUCH_TARGET,
            minWidth: MIN_TOUCH_TARGET,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: fontSize.sm }}>
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
