/**
 * Client for voice onboarding API. Sends user message + current step/collected data,
 * returns AI reply + extracted entities + next step.
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const VOICE_API_URL = process.env.EXPO_PUBLIC_VOICE_API_URL ?? '';
let ONBOARDING_API_URL = process.env.EXPO_PUBLIC_VOICE_ONBOARDING_URL ?? '';
if (!ONBOARDING_API_URL && VOICE_API_URL) {
  ONBOARDING_API_URL = VOICE_API_URL.replace(/\/api\/voice-to-data\/?$/, '') + '/api/voice-onboarding';
}

const ONBOARDING_SYSTEM = `You are the Life OS voice onboarding assistant. You're having a short, friendly conversation to set up the user's household. Be warm and concise.

You move through steps in order: household → pets → bills → review.

RULES:
1. From the user's message, extract ONLY new entities they mentioned this turn. Don't repeat what was already collected.
2. members: array of { name (string), relationship (string, e.g. husband, wife, kid, child, son, daughter), age (number or null) }
3. pets: array of { name (string), type (string, e.g. dog, cat) }
4. bills: array of { bill_name (string, e.g. "Electric", "Netflix"), provider_name (string, e.g. "TXU", "AT&T"), amount (number or null) }
5. If the user says "none", "no", "skip", "not really" for a step, return empty arrays for that type and set nextStep to the next step. Confirm briefly and ask the next topic.
6. For household: if they list people (e.g. "me, my husband John, two kids Emma 10 and Jake 7"), extract John (relationship: husband), Emma (relationship: child, age: 10), Jake (relationship: child, age: 7). Don't add "me" as a member.
7. For bills: if they only list names (e.g. "Electric with TXU, internet with AT&T, Netflix, mortgage with Chase"), extract bill_name and provider_name; amount can be null. nextStep can stay "bills" so the next question asks for amounts.
8. When you have at least one bill and user has given amounts or said "skip" for amounts, set nextStep to "review". If user only listed bill names, ask "Can you tell me the rough amounts for each?" and nextStep stays "bills".
9. aiReply must be a short, natural reply (1-3 sentences). After extracting, confirm what you added and ask the next question, or say "Let's review what we have." when moving to review.
10. Return ONLY valid JSON: { "aiReply": "...", "extracted": { "members": [], "pets": [], "bills": [] }, "nextStep": "household"|"pets"|"bills"|"review" }
`;

function buildUserPrompt(
  step: OnboardingStep,
  collected: OnboardingCollected,
  userMessage: string
): string {
  return [
    `Current step: ${step}.`,
    `Already collected:`,
    `- members: ${JSON.stringify(collected.members)}`,
    `- pets: ${JSON.stringify(collected.pets)}`,
    `- bills: ${JSON.stringify(collected.bills)}`,
    `User just said: "${userMessage}"`,
    `Respond with JSON only: aiReply, extracted (only new items from this message), nextStep.`,
  ].join('\n');
}

async function chatWithOpenAI(
  step: OnboardingStep,
  collected: OnboardingCollected,
  userMessage: string
): Promise<VoiceOnboardingResponse> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ONBOARDING_SYSTEM },
        { role: 'user', content: buildUserPrompt(step, collected, userMessage) },
      ],
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No onboarding response');
  const parsed = JSON.parse(raw) as VoiceOnboardingResponse;
  const nextStep = ['household', 'pets', 'bills', 'review'].includes(parsed.nextStep)
    ? parsed.nextStep
    : 'review';
  return {
    aiReply: parsed.aiReply,
    extracted: {
      members: Array.isArray(parsed.extracted?.members) ? parsed.extracted.members : [],
      pets: Array.isArray(parsed.extracted?.pets) ? parsed.extracted.pets : [],
      bills: Array.isArray(parsed.extracted?.bills) ? parsed.extracted.bills : [],
    },
    nextStep,
  };
}

export type OnboardingStep = 'household' | 'pets' | 'bills' | 'review';

export type OnboardingMember = { name: string; relationship?: string; age?: number | null };
export type OnboardingPet = { name: string; type?: string };
export type OnboardingBill = {
  bill_name: string;
  provider_name?: string;
  amount?: number | null;
};

export type OnboardingCollected = {
  members: OnboardingMember[];
  pets: OnboardingPet[];
  bills: OnboardingBill[];
};

export type VoiceOnboardingResponse = {
  aiReply: string;
  extracted: {
    members: OnboardingMember[];
    pets: OnboardingPet[];
    bills: OnboardingBill[];
  };
  nextStep: OnboardingStep;
};

export async function sendOnboardingMessage(
  step: OnboardingStep,
  collected: OnboardingCollected,
  userMessage: string
): Promise<VoiceOnboardingResponse> {
  if (ONBOARDING_API_URL) {
    return sendOnboardingMessageViaApi(step, collected, userMessage);
  }
  return chatWithOpenAI(step, collected, userMessage);
}

async function sendOnboardingMessageViaApi(
  step: OnboardingStep,
  collected: OnboardingCollected,
  userMessage: string
): Promise<VoiceOnboardingResponse> {
  const res = await fetch(ONBOARDING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step,
      collected: {
        members: collected.members,
        pets: collected.pets,
        bills: collected.bills,
      },
      userMessage: userMessage.trim(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Voice onboarding API error: ${res.status}`);
  }

  const data = (await res.json()) as VoiceOnboardingResponse;
  if (!data.aiReply || !data.nextStep) {
    throw new Error('Invalid voice onboarding response');
  }
  return data;
}

export const hasVoiceOnboardingApi = Boolean(ONBOARDING_API_URL);
export const hasVoiceOnboarding = Boolean(ONBOARDING_API_URL || OPENAI_API_KEY);
