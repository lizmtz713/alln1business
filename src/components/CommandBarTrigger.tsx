import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCommandBar } from '../contexts/CommandBarContext';
import { useAuth } from '../providers/AuthProvider';
import { hapticLight } from '../lib/haptics';

/**
 * Floating button to open the universal command bar (Spotlight-style).
 * Renders when user is signed in; tap or long-press to open.
 */
export function CommandBarTrigger() {
  const insets = useSafeAreaInsets();
  const { open } = useCommandBar();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        open();
      }}
      onLongPress={() => {
        hapticLight();
        open();
      }}
      activeOpacity={0.8}
      style={[
        styles.fab,
        {
          bottom: (Platform.OS === 'ios' ? insets.bottom : 24) + 56,
          left: 20,
        },
      ]}
    >
      <Ionicons name="search" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
