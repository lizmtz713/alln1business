import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '../lib/haptics';

export type SmartAction = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** If false, action is not shown */
  visible?: boolean;
};

type SmartActionBarProps = {
  actions: SmartAction[];
  title?: string;
  /** Compact single-row horizontal scroll */
  horizontal?: boolean;
};

export function SmartActionBar({ actions, title, horizontal = true }: SmartActionBarProps) {
  const visible = actions.filter((a) => a.visible !== false);

  if (visible.length === 0) return null;

  const handlePress = (action: SmartAction) => {
    hapticLight();
    action.onPress();
  };

  const content = (
    <>
      {visible.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={() => handlePress(action)}
          style={styles.button}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={action.icon} size={22} color="#3B82F6" />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scrollContent: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: {
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconWrap: { marginBottom: 4 },
  label: { color: '#E2E8F0', fontSize: 12, fontWeight: '500' },
});
