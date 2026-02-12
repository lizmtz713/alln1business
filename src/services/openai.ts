const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
export const hasOpenAIKey = Boolean(OPENAI_API_KEY);

let chatCompletionInFlight = false;

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type ChatCompletionOptions = {
  model?: string;
  maxTokens?: number;
};

export async function chatCompletion(
  messages: ChatMessage[],
  opts?: ChatCompletionOptions
): Promise<string> {
  if (!hasOpenAIKey) {
    return 'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file to enable AI chat. I could answer questions about your business data, suggest next steps, and help you draft documents.';
  }
  if (chatCompletionInFlight) {
    return 'Please wait for the previous response to finish.';
  }
  chatCompletionInFlight = true;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: opts?.model ?? 'gpt-4o-mini',
        messages,
        max_tokens: opts?.maxTokens ?? 600,
      }),
    });
    if (!res.ok) {
      if (__DEV__) console.warn('[OpenAI] chatCompletion API error:', res.status);
      return 'Sorry, I had trouble getting a response. Please try again.';
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    return text || 'I could not generate a response. Please try again.';
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] chatCompletion error:', e);
    return 'An error occurred. Please check your connection and try again.';
  } finally {
    chatCompletionInFlight = false;
  }
}

const EXPENSE_CATS =
  'supplies, travel, meals, utilities, software, contractors, marketing, insurance, rent, equipment, professional, taxes, payroll, shipping, vehicle, office, bank_fees, other';
const INCOME_CATS = 'sales, services, other_income';

export type CategorizationResult = {
  category: string;
  confidence: number;
};

export async function categorizeTransaction(
  vendor: string,
  amount: number,
  description?: string | null
): Promise<CategorizationResult> {
  if (!hasOpenAIKey) {
    return { category: 'other', confidence: 0 };
  }

  try {
    const type = amount >= 0 ? 'INCOME' : 'EXPENSE';
    const cats = amount >= 0 ? INCOME_CATS : EXPENSE_CATS;

    const prompt = `Categorize this business transaction.
Vendor: ${vendor}
Amount: $${Math.abs(amount)}
${description ? `Description: ${description}` : ''}
Type: ${type}
Categories: ${cats}
Return JSON only: {"category": "other", "confidence": 0.95}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      }),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[OpenAI] API error:', res.status);
      return { category: 'other', confidence: 0 };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { category: 'other', confidence: 0 };

    const parsed = JSON.parse(jsonMatch[0]) as { category?: string; confidence?: number };
    const category = String(parsed.category ?? 'other').toLowerCase();
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) ?? 0));

    return { category, confidence };
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] categorizeTransaction error:', e);
    return { category: 'other', confidence: 0 };
  }
}

export async function categorizeTransactionsBatch(
  items: Array<{ vendor: string; amount: number; description?: string | null }>
): Promise<CategorizationResult[]> {
  if (!hasOpenAIKey || items.length === 0) {
    return items.map(() => ({ category: 'other', confidence: 0 }));
  }

  try {
    const list = items
      .slice(0, 20)
      .map(
        (t, i) =>
          `${i + 1}. Vendor: ${t.vendor}, Amount: $${Math.abs(t.amount)}${t.description ? `, Desc: ${t.description}` : ''}, Type: ${t.amount >= 0 ? 'INCOME' : 'EXPENSE'}`
      )
      .join('\n');

    const prompt = `Categorize these business transactions. For each, return category and confidence 0-1.
Expense categories: ${EXPENSE_CATS}
Income categories: ${INCOME_CATS}

${list}

Return a JSON array only, one object per line item in order: [{"category":"other","confidence":0.9},...]`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[OpenAI] Batch API error:', res.status);
      return items.map(() => ({ category: 'other', confidence: 0 }));
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return items.map(() => ({ category: 'other', confidence: 0 }));

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ category?: string; confidence?: number }>;
    const results: CategorizationResult[] = items.map((_, i) => {
      const p = parsed[i];
      if (!p) return { category: 'other', confidence: 0 };
      return {
        category: String(p.category ?? 'other').toLowerCase(),
        confidence: Math.min(1, Math.max(0, Number(p.confidence) ?? 0)),
      };
    });
    return results;
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] categorizeTransactionsBatch error:', e);
    return items.map(() => ({ category: 'other', confidence: 0 }));
  }
}

export type DocumentGenerateType =
  | 'nda'
  | 'service_agreement'
  | 'contractor_agreement'
  | 'w9_request_letter'
  | 'custom';

export type DocumentGenerateParams = {
  type: DocumentGenerateType;
  profile?: { business_name?: string | null; full_name?: string | null };
  otherParty?: { name: string; address?: string; email?: string };
  specificTerms?: string;
  customDescription?: string;
};

export type DocumentGenerateResult = {
  title: string;
  content: string;
};

const DISCLAIMER =
  '\n\n— Not legal advice. Consider attorney review. Generated by Alln1 Business.';

function buildKeyBlanksSection(missing: string[]): string {
  if (missing.length === 0) return '';
  return `KEY BLANKS TO CONFIRM: ${missing.join(', ')}\n\n`;
}

export async function generateDocumentText(
  params: DocumentGenerateParams
): Promise<DocumentGenerateResult> {
  const missing: string[] = [];
  if (!params.otherParty?.name?.trim()) missing.push('Other party name');
  const businessName = params.profile?.business_name || params.profile?.full_name || 'Company';

  if (!hasOpenAIKey) {
    return {
      title: 'Document Draft',
      content:
        buildKeyBlanksSection(missing) +
        'AI generation requires EXPO_PUBLIC_OPENAI_API_KEY. Please add your OpenAI API key to use AI document generation.\n\nAlternatively, use a template from the Templates library for a non-AI draft.' +
        DISCLAIMER,
    };
  }

  try {
    let systemPrompt = `You are a business document assistant. Generate professional, concise business documents in plain text. No markdown, no tables. Use clear sections and paragraphs. Always include a short disclaimer at the end: "Not legal advice. Consider attorney review."`;

    let userPrompt = '';
    const otherParty = params.otherParty;
    const otherInfo = otherParty
      ? `Other party: ${otherParty.name}${otherParty.address ? `, Address: ${otherParty.address}` : ''}${otherParty.email ? `, Email: ${otherParty.email}` : ''}`
      : '';

    switch (params.type) {
      case 'nda':
        userPrompt = `Generate a Non-Disclosure Agreement. Disclosing Party: ${businessName}. ${otherInfo}. Effective date: [to be filled]. ${params.specificTerms || ''}`;
        break;
      case 'service_agreement':
        userPrompt = `Generate a Service Agreement. Service Provider: ${businessName}. Client: ${otherInfo}. ${params.specificTerms || 'Include scope, payment terms, and term sections.'}`;
        break;
      case 'contractor_agreement':
        userPrompt = `Generate an Independent Contractor Agreement. Company: ${businessName}. Contractor: ${otherInfo}. Include independent contractor status, scope, payment, term. ${params.specificTerms || ''}`;
        break;
      case 'w9_request_letter':
        userPrompt = `Generate a brief W-9 request letter from ${businessName} to vendor ${otherInfo}. Professional, concise. Include due date placeholder.`;
        break;
      case 'custom':
        userPrompt = `Generate a business document based on: ${params.customDescription || 'general business agreement'}. Business: ${businessName}. ${otherInfo}. ${params.specificTerms || ''}`;
        break;
      default:
        userPrompt = `Generate a business document. Business: ${businessName}. ${otherInfo}. ${params.specificTerms || ''}`;
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[OpenAI] generateDocumentText API error:', res.status);
      return {
        title: 'Document Draft',
        content:
          buildKeyBlanksSection(missing) +
          'Unable to generate document. Please try again or use a template.' +
          DISCLAIMER,
      };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let content = data.choices?.[0]?.message?.content?.trim() ?? '';

    if (!content.includes('Not legal advice')) {
      content += DISCLAIMER;
    }

    const title =
      params.type === 'nda'
        ? 'Non-Disclosure Agreement'
        : params.type === 'service_agreement'
          ? 'Service Agreement'
          : params.type === 'contractor_agreement'
            ? 'Contractor Agreement'
            : params.type === 'w9_request_letter'
              ? 'W-9 Request Letter'
              : 'Document';

    return {
      title,
      content: buildKeyBlanksSection(missing) + content,
    };
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] generateDocumentText error:', e);
    return {
      title: 'Document Draft',
      content:
        buildKeyBlanksSection(missing) +
        'An error occurred while generating. Please try again or use a template.' +
        DISCLAIMER,
    };
  }
}
