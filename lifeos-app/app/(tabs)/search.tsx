import { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/constants';

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const recentSearches = ['car insurance', 'emma shoes', 'dentist', 'electric bill'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl }}>
      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          placeholder="Search anything..."
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.md,
            color: colors.text,
            fontSize: fontSize.base,
          }}
        />
        {query.length > 0 && (
          <Ionicons name="close-circle" size={20} color={colors.textMuted} onPress={() => setQuery('')} />
        )}
      </View>

      {/* Recent Searches */}
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
        Recent Searches
      </Text>
      <ScrollView>
        {recentSearches.map((search, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="time-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.md }} />
            <Text style={{ color: colors.text, fontSize: fontSize.base }}>{search}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
