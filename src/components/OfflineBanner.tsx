import { View, Text } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { colors, spacing, fontSize } from '../lib/constants';

type Props = {
  lastUpdated?: Date | null;
  showLastUpdated?: boolean;
};

export function OfflineBanner({ lastUpdated, showLastUpdated }: Props) {
  const { isConnected, isUnknown } = useNetworkStatus();

  if (isConnected || isUnknown) return null;

  return (
    <View
      style={{
        backgroundColor: colors.warning,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#000', fontSize: fontSize.sm, fontWeight: '600' }}>
        Offline — showing cached data
      </Text>
      {showLastUpdated && lastUpdated && (
        <Text style={{ color: '#333', fontSize: fontSize.xs, marginTop: 2 }}>
          Last updated {formatRelative(lastUpdated)}
        </Text>
      )}
    </View>
  );
}

function formatRelative(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  const h = Math.floor(diff / 60);
  return `${h} hr${h > 1 ? 's' : ''} ago`;
}
