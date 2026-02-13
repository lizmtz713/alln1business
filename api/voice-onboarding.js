/**
 * POST /api/voice-onboarding
 * Body: { step, collected: { members, pets, bills }, userMessage }
 * Returns: { aiReply, extracted: { members?, pets?, bills? }, nextStep }
 * Used for conversational voice onboarding (household → pets → bills → review).
 */

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

function buildUserPrompt(step, collected, userMessage) {
  const { members = [], pets = [], bills = [] } = collected;
  return [
    `Current step: ${step}.`,
    `Already collected:`,
    `- members: ${JSON.stringify(members)}`,
    `- pets: ${JSON.stringify(pets)}`,
    `- bills: ${JSON.stringify(bills)}`,
    `User just said: "${userMessage}"`,
    `Respond with JSON only: aiReply, extracted (only new items from this message), nextStep.`,
  ].join('\n');
}

async function chat(apiKey, step, collected, userMessage) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No onboarding response');
  const parsed = JSON.parse(raw);
  if (!parsed.aiReply || !parsed.nextStep) throw new Error('Invalid onboarding response');
  return {
    aiReply: String(parsed.aiReply),
    extracted: {
      members: Array.isArray(parsed.extracted?.members) ? parsed.extracted.members : [],
      pets: Array.isArray(parsed.extracted?.pets) ? parsed.extracted.pets : [],
      bills: Array.isArray(parsed.extracted?.bills) ? parsed.extracted.bills : [],
    },
    nextStep: ['household', 'pets', 'bills', 'review'].includes(parsed.nextStep)
      ? parsed.nextStep
      : 'review',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { step, collected = {}, userMessage } = body;

    const allowedSteps = ['household', 'pets', 'bills', 'review'];
    const currentStep = allowedSteps.includes(step) ? step : 'household';
    const userText =
      typeof userMessage === 'string' && userMessage.trim()
        ? userMessage.trim()
        : '';

    if (!userText) {
      return res.status(400).json({
        error: 'Provide userMessage (transcript of what the user said)',
      });
    }

    const result = await chat(apiKey, currentStep, collected, userText);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
