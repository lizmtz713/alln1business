import '../global.css';

import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { QueryProvider } from '../src/providers/QueryProvider';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';

export { ErrorBoundary } from 'expo-router';

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryProvider>
  );
}
