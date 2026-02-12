import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { router } from 'expo-router';

export default function MoreScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-slate-900 p-6">
      <Text className="text-xl font-semibold text-white">More</Text>
      <Text className="mt-2 text-slate-400">Coming soon</Text>
      {user && (
        <TouchableOpacity
          className="mt-8 rounded-xl bg-slate-800 py-3"
          onPress={handleSignOut}
        >
          <Text className="text-center font-medium text-red-400">Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
