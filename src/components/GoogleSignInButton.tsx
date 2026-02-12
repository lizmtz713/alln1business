import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  loading: externalLoading = false,
}: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  async function handlePress() {
    setInternalLoading(true);
    const { error } = await signInWithGoogle();
    setInternalLoading(false);
    if (error) {
      onError?.(error);
    } else if (onSuccess) {
      onSuccess();
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className="flex-row items-center justify-center rounded-xl border border-slate-600 bg-white py-3 px-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#757575" />
      ) : (
        <>
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={{ width: 20, height: 20, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text className="font-medium text-slate-600">Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
