import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../types';

const SUGGESTED_QUESTIONS = [
  "Is this expense tax deductible?",
  "What's the difference between W-9 and 1099?",
  "How do I categorize home office expenses?",
  "When are quarterly taxes due?",
  "Can I deduct my phone bill?",
  "What records should I keep for an audit?",
];

export function AIScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // TODO: Replace with actual AI API call
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
    }, 1500);
  };

  // Placeholder AI responses
  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('deductible') || q.includes('deduct')) {
      return "Great question! Business expenses are generally tax deductible if they're \"ordinary and necessary\" for your business. Common deductible expenses include:\n\n• Office supplies & equipment\n• Business travel & meals (50%)\n• Professional services\n• Software subscriptions\n• Home office expenses\n• Marketing & advertising\n\nWould you like me to help categorize a specific expense?";
    }
    if (q.includes('w-9') || q.includes('1099')) {
      return "**W-9 vs 1099:**\n\n📋 **W-9** is a form you fill out to give your tax info (name, address, EIN/SSN) to clients who will pay you. It's a request for your information.\n\n📄 **1099-NEC** is a form a client sends YOU (and the IRS) showing they paid you $600+ during the year.\n\n**Summary:** You give W-9s, you receive 1099s.\n\nNeed help with either form?";
    }
    if (q.includes('quarterly') || q.includes('estimated')) {
      return "📅 **Quarterly Estimated Tax Due Dates:**\n\n• Q1: April 15\n• Q2: June 15\n• Q3: September 15\n• Q4: January 15 (next year)\n\nYou should pay quarterly if you expect to owe $1,000+ in taxes. Use Form 1040-ES to calculate and pay.\n\n**Tip:** Set aside 25-30% of your income for taxes!";
    }
    if (q.includes('home office')) {
      return "🏠 **Home Office Deduction:**\n\nYou can deduct home office expenses if you use part of your home *exclusively and regularly* for business.\n\n**Two methods:**\n\n1. **Simplified:** $5/sq ft, max 300 sq ft = $1,500 max\n\n2. **Regular:** Calculate % of home used, apply to actual expenses (rent, utilities, insurance, repairs)\n\n**Required:** Measure your dedicated workspace and keep receipts!";
    }
    
    return "That's a great question about business finances! While I can provide general guidance, tax situations can vary. Here's what I'd suggest:\n\n1. Keep detailed records of all business transactions\n2. Save receipts for expenses over $75\n3. Separate business and personal expenses\n4. Consider consulting a CPA for complex situations\n\nWould you like me to help with something more specific?";
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
