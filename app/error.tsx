import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorState } from '../src/components/ui';

export default function ErrorScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ErrorState
        message="Something went wrong. Try again or restart the app."
        onRetry={() => router.replace('/')}
      />
    </View>
  );
}
