import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, TextInput, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BusinessType } from '../types';

const { width } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  businessName: string;
  businessType: BusinessType;
  challenges: string[];
}

const BUSINESS_TYPES: { type: BusinessType; label: string; icon: string; description: string }[] = [
  { type: 'sole_proprietor', label: 'Sole Proprietor', icon: 'person', description: 'Just me, no formal structure' },
  { type: 'llc', label: 'LLC', icon: 'business', description: 'Limited liability company' },
  { type: 'corporation', label: 'Corporation', icon: 'briefcase', description: 'Inc. or Corp' },
  { type: 's_corp', label: 'S-Corp', icon: 'trending-up', description: 'S-Corporation election' },
  { type: 'partnership', label: 'Partnership', icon: 'people', description: 'Multiple owners' },
  { type: 'nonprofit', label: 'Nonprofit', icon: 'heart', description: '501(c)(3) organization' },
];

const CHALLENGES = [
  { id: 'receipts', label: 'Tracking receipts', icon: 'receipt' },
  { id: 'taxes', label: 'Understanding taxes', icon: 'document-text' },
  { id: 'bills', label: 'Remembering bill due dates', icon: 'calendar' },
  { id: 'deductions', label: 'Finding deductions', icon: 'search' },
  { id: 'organization', label: 'Staying organized', icon: 'folder' },
  { id: 'time', label: 'Bookkeeping takes too long', icon: 'time' },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [challenges, setChallenges] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const nextStep = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(s => s + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const toggleChallenge = (id: string) => {
    setChallenges(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    if (businessType) {
      onComplete({ businessName, businessType, challenges });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome to Alln1</Text>
            <Text style={styles.subtitle}>
              Let's set up your business in under 60 seconds
            </Text>
            <View style={styles.features}>
              <FeatureItem icon="receipt" text="Snap receipts & auto-categorize" />
              <FeatureItem icon="notifications" text="Never miss a bill payment" />
              <FeatureItem icon="document-text" text="All your docs in one place" />
              <FeatureItem icon="chatbubbles" text="AI answers tax questions" />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
              <Text style={styles.primaryButtonText}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>🏢</Text>
            <Text style={styles.title}>What's your business called?</Text>
            <Text style={styles.subtitle}>
              This helps personalize your experience
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Smith Consulting"
              placeholderTextColor="#94A3B8"
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.primaryButton, !businessName && styles.buttonDisabled]} 
              onPress={nextStep}
              disabled={!businessName}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextStep}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>📋</Text>
            <Text style={styles.title}>What type of business?</Text>
            <Text style={styles.subtitle}>
              This helps us give better tax advice
            </Text>
            <View style={styles.optionsGrid}>
              {BUSINESS_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt.type}
                  style={[
                    styles.optionCard,
                    businessType === bt.type && styles.optionCardSelected
                  ]}
                  onPress={() => setBusinessType(bt.type)}
                >
                  <Ionicons 
                    name={bt.icon as any} 
                    size={24} 
                    color={businessType === bt.type ? '#FFF' : '#3B82F6'} 
                  />
                  <Text style={[
                    styles.optionLabel,
                    businessType === bt.type && styles.optionLabelSelected
                  ]}>
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, !businessType && styles.buttonDisabled]} 
              onPress={nextStep}
              disabled={!businessType}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>What's your biggest challenge?</Text>
            <Text style={styles.subtitle}>
              Select all that apply — we'll help you tackle them
            </Text>
            <View style={styles.challengeGrid}>
              {CHALLENGES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.challengeCard,
                    challenges.includes(c.id) && styles.challengeCardSelected
                  ]}
                  onPress={() => toggleChallenge(c.id)}
                >
                  <Ionicons 
                    name={c.icon as any} 
                    size={22} 
                    color={challenges.includes(c.id) ? '#FFF' : '#64748B'} 
                  />
                  <Text style={[
                    styles.challengeLabel,
                    challenges.includes(c.id) && styles.challengeLabelSelected
                  ]}>
                    {c.label}
                  </Text>
                  {challenges.includes(c.id) && (
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.emoji}>🚀</Text>
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.subtitle}>
              Here's what to do first:
            </Text>
            <View style={styles.todoList}>
              <TodoItem number={1} text="Snap your first receipt" time="30 sec" />
              <TodoItem number={2} text="Add a recurring bill" time="1 min" />
              <TodoItem number={3} text="Upload your W-9" time="2 min" />
            </View>
            <View style={styles.readinessPreview}>
              <Text style={styles.readinessLabel}>Tax Readiness Score</Text>
              <Text style={styles.readinessScore}>0%</Text>
              <Text style={styles.readinessHint}>Complete tasks to increase your score!</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
              <Text style={styles.primaryButtonText}>Start Using Alln1</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View 
              key={i}
              style={[
                styles.progressDot,
                i === step && styles.progressDotActive,
                i < step && styles.progressDotComplete
              ]}
            />
          ))}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={20} color="#3B82F6" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function TodoItem({ number, text, time }: { number: number; text: string; time: string }) {
  return (
    <View style={styles.todoItem}>
      <View style={styles.todoNumber}>
        <Text style={styles.todoNumberText}>{number}</Text>
      </View>
      <Text style={styles.todoText}>{text}</Text>
      <Text style={styles.todoTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#FFF',
  },
  progressDotComplete: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  content: { flex: 1, justifyContent: 'center' },
  stepContent: { 
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  features: { width: '100%', marginBottom: 24 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: { fontSize: 15, color: '#374151', flex: 1 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    width: '100%',
  },
  buttonDisabled: { backgroundColor: '#CBD5E1' },
  primaryButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  skipText: { color: '#64748B', fontSize: 15, marginTop: 16 },
  textInput: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 18,
    fontSize: 17,
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    justifyContent: 'center',
  },
  optionCard: {
    width: (width - 100) / 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  optionCardSelected: { backgroundColor: '#3B82F6' },
  optionLabel: { fontSize: 12, color: '#374151', textAlign: 'center' },
  optionLabelSelected: { color: '#FFF' },
  challengeGrid: { width: '100%', marginBottom: 24 },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  challengeCardSelected: { backgroundColor: '#3B82F6' },
  challengeLabel: { flex: 1, fontSize: 15, color: '#374151' },
  challengeLabelSelected: { color: '#FFF' },
  todoList: { width: '100%', marginBottom: 20 },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  todoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todoNumberText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  todoText: { flex: 1, fontSize: 15, color: '#1E293B' },
  todoTime: { fontSize: 12, color: '#64748B' },
  readinessPreview: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  readinessLabel: { fontSize: 13, color: '#92400E' },
  readinessScore: { fontSize: 36, fontWeight: '700', color: '#B45309' },
  readinessHint: { fontSize: 12, color: '#92400E' },
});
