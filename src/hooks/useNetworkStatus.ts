import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? state.isInternetReachable ?? null);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected: isConnected === true, isUnknown: isConnected === null };
}
