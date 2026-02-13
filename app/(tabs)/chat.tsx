import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useChatHistory,
  useSendChatMessage,
  useClearChat,
  hasOpenAIKey,
  type ChatMessage,
} from '../../src/hooks/useChat';
import { hasSupabaseEnv } from '../../src/services/env';
import { Skeleton } from '../../src/components/ui';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';
import { format, parseISO } from 'date-fns';

const SUGGESTED_QUESTIONS = [
  'What bills are due this week?',
  'When is the car registration due?',
  'What\'s the dog\'s vet phone number?',
  'How much do we spend on subscriptions?',
  'Remind me to renew car registration in 2 weeks',
  'Add milk to the shopping list',
  'Schedule haircut for Saturday',
  'Mark the electric bill as paid',
];

function getQuickActionButtons(content: string): { label: string; route: string }[] {
  const lower = content.toLowerCase();
  const buttons: { label: string; route: string }[] = [];
  if (lower.includes('bill')) buttons.push({ label: 'Bills', route: '/(tabs)/documents' });
  if (lower.includes('appointment') || lower.includes('calendar') || lower.includes('schedule')) buttons.push({ label: 'Calendar', route: '/(tabs)/calendar' });
  if (lower.includes('vehicle') || lower.includes('car')) buttons.push({ label: 'Vehicles', route: '/(tabs)/household' });
  if (lower.includes('pet') || lower.includes('vet')) buttons.push({ label: 'Pets', route: '/(tabs)/household' });
  if (lower.includes('document')) buttons.push({ label: 'Documents', route: '/(tabs)/documents' });
  if (lower.includes('shopping') || lower.includes('list')) buttons.push({ label: 'Household', route: '/(tabs)/household' });
  return buttons;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const showQuickActions = msg.role === 'assistant';
  const router = useRouter();
  const buttons = showQuickActions ? getQuickActionButtons(msg.content) : [];

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: isUser ? '#3B82F6' : '#1E293B',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: '#F8FAFC', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
        <Text
          style={{
            color: isUser ? '#BFDBFE' : '#64748B',
            fontSize: 11,
            marginTop: 6,
          }}
        >
          {format(parseISO(msg.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      {buttons.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginLeft: 4 }}>
          {buttons.map((b) => (
            <TouchableOpacity
              key={b.label}
              onPress={() => {
                hapticLight();
                router.push(b.route as never);
              }}
              style={{
                backgroundColor: '#334155',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '500' }}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { data: messages = [], isLoading, refetch, isRefetching } = useChatHistory();
  const sendMessage = useSendChatMessage();
  const clearChat = useClearChat();
  const [input, setInput] = useState('');
  const [lastActions, setLastActions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendMessage.isPending || !hasSupabaseEnv) return;
    setInput('');
    setLastActions([]);
    try {
      const result = await sendMessage.mutateAsync(text);
      if (result.toolsUsed?.length) {
        setLastActions(result.toolsUsed.map((t) => t.result));
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleSuggestion = async (q: string) => {
    if (sendMessage.isPending || !hasSupabaseEnv) return;
    setLastActions([]);
    try {
      const result = await sendMessage.mutateAsync(q);
      if (result.toolsUsed?.length) {
        setLastActions(result.toolsUsed.map((t) => t.result));
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Delete all chat messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearChat.mutateAsync();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: '#0F172A',
          borderBottomWidth: 1,
          borderBottomColor: '#1E293B',
        }}
      >
        <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: 'bold' }}>Household Assistant</Text>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            handleClearChat();
          }}
          disabled={!hasSupabaseEnv}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        >
          <Text style={{ color: hasSupabaseEnv ? '#94A3B8' : '#64748B', fontSize: 14 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {!hasSupabaseEnv && (
        <View
          style={{
            backgroundColor: '#7F1D1D',
            marginHorizontal: 24,
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FECACA', fontSize: 13 }}>
            Connect Supabase to save chat history and use household data (bills, pets, appointments, etc.).
          </Text>
        </View>
      )}
      {!hasOpenAIKey && (
        <View
          style={{
            backgroundColor: '#334155',
            marginHorizontal: 24,
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FCD34D', fontSize: 13 }}>
            Add EXPO_PUBLIC_OPENAI_API_KEY to enable the assistant. I can answer questions about your household (bills, pets, vehicles, appointments) and take actions like adding reminders, shopping list items, or marking bills paid.
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, padding: 24 }}>
          <Skeleton height={64} style={{ marginBottom: 16 }} />
          <Skeleton height={64} width="80%" style={{ marginBottom: 16, alignSelf: 'flex-end' }} />
          <Skeleton height={64} style={{ marginBottom: 16 }} />
          <Skeleton height={64} width="70%" style={{ alignSelf: 'flex-end' }} />
        </View>
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 16, textAlign: 'center', marginBottom: 24 }}>
            I know your household—bills, pets, vehicles, appointments, and more. Ask or tell me to do something:
          </Text>
          <View style={{ gap: 10 }}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => {
                  hapticLight();
                  handleSuggestion(q);
                }}
                style={{
                  backgroundColor: '#1E293B',
                  padding: 16,
                  minHeight: MIN_TOUCH_TARGET,
                  justifyContent: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <Text style={{ color: '#F8FAFC', fontSize: 15 }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#3B82F6" />
          }
        />
      )}

      {sendMessage.isPending && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8, alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 12 }}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>Thinking...</Text>
          </View>
        </View>
      )}

      {lastActions.length > 0 && !sendMessage.isPending && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 8, alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: '#134E4A', borderRadius: 12, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ color: '#5EEAD4', fontSize: 12, fontWeight: '600', width: '100%' }}>Done:</Text>
            {lastActions.map((a, i) => (
              <Text key={i} style={{ color: '#99F6E4', fontSize: 12 }}>{a}</Text>
            ))}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            paddingBottom: 34,
            backgroundColor: '#0F172A',
            borderTopWidth: 1,
            borderTopColor: '#1E293B',
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#1E293B',
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 12,
              color: '#F8FAFC',
              fontSize: 16,
              maxHeight: 120,
            }}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about bills, pets, appointments… or say \"Add milk to list\""
            placeholderTextColor="#64748B"
            multiline
            editable={!sendMessage.isPending}
          />
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              handleSend();
            }}
            disabled={!input.trim() || sendMessage.isPending || !hasSupabaseEnv}
            style={{
              marginLeft: 12,
              backgroundColor: input.trim() && !sendMessage.isPending && hasSupabaseEnv ? '#3B82F6' : '#334155',
              width: 48,
              height: 48,
              minWidth: MIN_TOUCH_TARGET,
              minHeight: MIN_TOUCH_TARGET,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
