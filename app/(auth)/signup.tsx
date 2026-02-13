import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Sign up is handled by Google Sign-In on the login screen.
 * Redirect to login so users use Google only.
 */
export default function SignupScreen() {
  useEffect(() => {
    router.replace('/(auth)/login' as never);
  }, []);
  return null;
}
