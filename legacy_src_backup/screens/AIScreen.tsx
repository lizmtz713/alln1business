import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../types';
import { getAIResponse } from '../services/aiService';
import { useFeatureGate, useFeatureUsage } from '../hooks/useFeatureGate';

const SUGGESTED_QUESTIONS = [
  "Is my home office tax deductible?",
  "What's the difference between W-9 and 1099?",
  "Can I deduct my phone bill?",
  "When are quarterly taxes due?",
  "What should I know about LLCs?",
  "How do I deduct business meals?",
];

export function AIScreen({ navigation }: any) {
  const { checkAIChatLimit, incrementAIChatCount, canUseAICFO } = useFeatureGate();
  const { getAIChatUsage } = useFeatureUsage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ used: 0, remaining: 3, limit: 3 });
  const scrollRef = useRef<ScrollView>(null);

  // Load usage info on mount
  useEffect(() => {
    const loadUsage = async () => {
      const usage = await getAIChatUsage();
      setUsageInfo(usage);
    };
    loadUsage();
  }, [messages]); // Refresh after each message

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Check AI chat limit before sending
    const allowed = await checkAIChatLimit();
    if (!allowed) {
      navigation.navigate('Paywall', { source: 'ai_limit' });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Increment the chat count for free tier tracking
    await incrementAIChatCount();

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate API delay, then get smart response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Business Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Usage Banner for free users */}
      {!canUseAICFO && (
        <TouchableOpacity 
          style={[
            styles.usageBanner,
            usageInfo.remaining <= 1 && styles.usageBannerWarning,
            usageInfo.remaining === 0 && styles.usageBannerDanger,
          ]}
          onPress={() => navigation.navigate('Paywall', { source: 'ai_limit' })}
        >
          <View style={styles.usageBannerContent}>
            <Ionicons 
              name={usageInfo.remaining === 0 ? "alert-circle" : "chatbubbles"} 
              size={18} 
              color={usageInfo.remaining === 0 ? "#DC2626" : usageInfo.remaining <= 1 ? "#D97706" : "#8B5CF6"} 
            />
            <Text style={[
              styles.usageBannerText,
              usageInfo.remaining === 0 && styles.usageBannerTextDanger,
            ]}>
              {usageInfo.remaining === 0 
                ? "Daily chat limit reached" 
                : `${usageInfo.remaining} of ${usageInfo.limit} chats remaining today`}
            </Text>
          </View>
          <Text style={styles.usageBannerUpgrade}>Upgrade →</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.welcomeIcon}
              >
                <Text style={styles.welcomeEmoji}>🤖</Text>
              </LinearGradient>
              <Text style={styles.welcomeTitle}>AI Business Assistant</Text>
              <Text style={styles.welcomeText}>
                Ask me anything about taxes, bookkeeping, deductions, business law, or entrepreneurship!
              </Text>

              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              <View style={styles.suggestions}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <TouchableOpacity 
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(q)}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => (
              <View 
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' && styles.userMessageText
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))
          )}
          
          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about taxes, deductions, bookkeeping..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={input.trim() ? '#FFF' : '#94A3B8'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  usageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  usageBannerWarning: {
    backgroundColor: '#FEF3C7',
  },
  usageBannerDanger: {
    backgroundColor: '#FEE2E2',
  },
  usageBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usageBannerText: {
    fontSize: 13,
    color: '#6D28D9',
    fontWeight: '500',
  },
  usageBannerTextDanger: {
    color: '#DC2626',
  },
  usageBannerUpgrade: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  keyboardView: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20 },
  welcome: { alignItems: 'center', paddingTop: 20 },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeEmoji: { fontSize: 40 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  welcomeText: { 
    fontSize: 15, 
    color: '#64748B', 
    textAlign: 'center', 
    marginTop: 8,
    paddingHorizontal: 20,
  },
  suggestionsTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#64748B', 
    marginTop: 32,
    marginBottom: 12,
  },
  suggestions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionText: { fontSize: 13, color: '#6366F1' },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#6366F1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, color: '#1E293B', lineHeight: 22 },
  userMessageText: { color: '#FFF' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#1E293B',
  },
  sendButton: {
    backgroundColor: '#6366F1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#E2E8F0' },
});
