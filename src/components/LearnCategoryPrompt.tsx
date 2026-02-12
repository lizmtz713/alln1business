import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  onYes: () => void;
  onNo: () => void;
  isPending?: boolean;
};

export function LearnCategoryPrompt({ onYes, onNo, isPending }: Props) {
  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
      }}
    >
      <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>
        Remember this for next time?
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={onYes}
          disabled={isPending}
          style={{
            flex: 1,
            backgroundColor: '#3B82F6',
            borderRadius: 8,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNo}
          disabled={isPending}
          style={{
            flex: 1,
            backgroundColor: '#334155',
            borderRadius: 8,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
