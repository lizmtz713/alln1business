import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/services/supabase';
import { Button, Input, Card } from '../../src/components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/constants';

const STEPS = ['household', 'members', 'priorities'];

const PRIORITIES = [
  { id: 'bills', icon: '💳', label: 'Bills & Subscriptions' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', label: 'Family & Kids' },
  { id: 'medical', icon: '🏥', label: 'Medical & Health' },
  { id: 'vehicles', icon: '🚗', label: 'Vehicles' },
  { id: 'pets', icon: '🐕', label: 'Pets' },
  { id: 'home', icon: '🏠', label: 'Home & Maintenance' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePriority = (id: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setLoading(true);
    await supabase.from('profiles').update({
      full_name: fullName,
      household_name: householdName,
      onboarding_completed: true,
    }).eq('id', user.id);
    await refreshProfile();
    setLoading(false);
    router.replace('/(tabs)');
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Progress */}
      <View style={{ flexDirection: 'row', padding: spacing.xl, gap: spacing.sm }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= step ? colors.accent : colors.surfaceAlt,
            }}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }}>
        {step === 0 && (
          <View>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm }}>
              Welcome to Life OS 👋
            </Text>
            <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.xxxl }}>
              Let's set up your household
            </Text>

            <Input
              label="Your Name"
              placeholder="John Smith"
              value={fullName}
              onChangeText={setFullName}
              containerStyle={{ marginBottom: spacing.lg }}
            />
            <Input
              label="Household Name"
              placeholder="The Smith Family"
              value={householdName}
              onChangeText={setHouseholdName}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm }}>
              Who's in your household?
            </Text>
            <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.xxxl }}>
              You can add more members later
            </Text>

            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text }}>
                👤 {fullName || 'You'}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>Admin</Text>
            </Card>

            <Button title="+ Add Family Member" variant="outline" onPress={() => {}} />
            <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }}>
              Skip for now - you can add members anytime
            </Text>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm }}>
              What matters most?
            </Text>
            <Text style={{ fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.xxxl }}>
              Select your priorities (we'll start here)
            </Text>

            <View style={{ gap: spacing.md }}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => togglePriority(p.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.lg,
                    backgroundColor: selectedPriorities.includes(p.id) ? colors.accent + '20' : colors.surface,
                    borderRadius: borderRadius.md,
                    borderWidth: 2,
                    borderColor: selectedPriorities.includes(p.id) ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>{p.icon}</Text>
                  <Text style={{ fontSize: fontSize.base, color: colors.text, flex: 1 }}>{p.label}</Text>
                  {selectedPriorities.includes(p.id) && (
                    <Text style={{ color: colors.accent }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={{ padding: spacing.xl }}>
        <Button
          title={step === STEPS.length - 1 ? "Let's Go!" : 'Continue'}
          onPress={nextStep}
          loading={loading}
        />
      </View>
    </View>
  );
}
