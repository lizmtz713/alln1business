/**
 * Persisted voice onboarding state for pause/resume.
 * Stored in AsyncStorage so user can continue later.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingStep,
  OnboardingMember,
  OnboardingPet,
  OnboardingBill,
} from './voiceOnboarding';

const STORAGE_KEY = 'alln1_voice_onboarding_state';

export type PersistedOnboardingState = {
  step: OnboardingStep;
  members: OnboardingMember[];
  pets: OnboardingPet[];
  bills: OnboardingBill[];
  aiReply: string;
  /** When we have no reply yet (e.g. fresh load), show welcome and ask first question */
  isInitialized: boolean;
};

const DEFAULT_STATE: PersistedOnboardingState = {
  step: 'household',
  members: [],
  pets: [],
  bills: [],
  aiReply: '',
  isInitialized: false,
};

export async function loadOnboardingState(): Promise<PersistedOnboardingState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedOnboardingState;
    if (!parsed.step || !Array.isArray(parsed.members)) return null;
    return {
      step: parsed.step,
      members: parsed.members ?? [],
      pets: parsed.pets ?? [],
      bills: parsed.bills ?? [],
      aiReply: parsed.aiReply ?? '',
      isInitialized: Boolean(parsed.isInitialized),
    };
  } catch {
    return null;
  }
}

export async function saveOnboardingState(state: PersistedOnboardingState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getDefaultState(): PersistedOnboardingState {
  return { ...DEFAULT_STATE };
}

export function getWelcomeMessage(): string {
  return "Welcome to Life OS! Let's set up your household. Who lives with you?";
}
