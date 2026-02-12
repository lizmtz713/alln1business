import { z } from 'zod';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
export const hasOpenAIKey = Boolean(OPENAI_API_KEY);

const RECEIPT_EXPENSE_CATS =
  'supplies, travel, meals, utilities, software, contractors, marketing, insurance, rent, equipment, professional, taxes, payroll, shipping, vehicle, office, bank_fees, other';

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
  source?: 'rule' | 'ai';
};

export type CategoryRuleForMatch = {
  id: string;
  match_type: string;
  match_value: string;
  category: string;
  applies_to: string;
  is_active: boolean;
  priority: number;
  created_at: string;
};

export async function categorizeTransaction(
  vendor: string,
  amount: number,
  description?: string | null,
  rules?: CategoryRuleForMatch[]
): Promise<CategorizationResult> {
  const type = amount >= 0 ? 'income' : 'expense';
  if (rules && rules.length > 0) {
    const { applyCategoryRules } = await import('./rules');
    const match = applyCategoryRules(
      { vendor: vendor || null, description: description || null, type },
      rules as Parameters<typeof applyCategoryRules>[1]
    );
    if (match.category) {
      return { category: match.category, confidence: 0.99, source: 'rule' };
    }
  }
  if (!hasOpenAIKey) {
    return { category: 'other', confidence: 0 };
  }

  try {
    const typeStr = type === 'income' ? 'INCOME' : 'EXPENSE';
    const cats = amount >= 0 ? INCOME_CATS : EXPENSE_CATS;

    const prompt = `Categorize this business transaction.
Vendor: ${vendor}
Amount: $${Math.abs(amount)}
${description ? `Description: ${description}` : ''}
Type: ${typeStr}
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

    return { category, confidence, source: 'ai' };
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] categorizeTransaction error:', e);
    return { category: 'other', confidence: 0 };
  }
}

export async function categorizeTransactionsBatch(
  items: Array<{ vendor: string; amount: number; description?: string | null }>,
  rules?: CategoryRuleForMatch[]
): Promise<CategorizationResult[]> {
  if (items.length === 0) return [];

  const results: CategorizationResult[] = new Array(items.length);
  const toSendToAI: { index: number; item: (typeof items)[0] }[] = [];

  if (rules && rules.length > 0) {
    const { applyCategoryRules } = await import('./rules');
    items.forEach((item, i) => {
      const type = item.amount >= 0 ? 'income' : 'expense';
      const match = applyCategoryRules(
        { vendor: item.vendor, description: item.description, type },
        rules as Parameters<typeof applyCategoryRules>[1]
      );
      if (match.category) {
        results[i] = { category: match.category, confidence: 0.99, source: 'rule' };
      } else {
        toSendToAI.push({ index: i, item });
      }
    });
  } else {
    items.forEach((item, i) => toSendToAI.push({ index: i, item }));
  }

  if (!hasOpenAIKey || toSendToAI.length === 0) {
    toSendToAI.forEach(({ index }) => {
      if (!results[index]) results[index] = { category: 'other', confidence: 0 };
    });
    return results;
  }

  try {
    const list = toSendToAI
      .slice(0, 20)
      .map(
        (x, i) =>
          `${i + 1}. Vendor: ${x.item.vendor}, Amount: $${Math.abs(x.item.amount)}${x.item.description ? `, Desc: ${x.item.description}` : ''}, Type: ${x.item.amount >= 0 ? 'INCOME' : 'EXPENSE'}`
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
      toSendToAI.forEach(({ index }) => {
        if (!results[index]) results[index] = { category: 'other', confidence: 0 };
      });
      return results;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      toSendToAI.forEach(({ index }) => {
        if (!results[index]) results[index] = { category: 'other', confidence: 0 };
      });
      return results;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ category?: string; confidence?: number }>;
    toSendToAI.forEach(({ index }, i) => {
      const p = parsed[i];
      results[index] = p
        ? {
            category: String(p.category ?? 'other').toLowerCase(),
            confidence: Math.min(1, Math.max(0, Number(p.confidence) ?? 0)),
            source: 'ai' as const,
          }
        : { category: 'other', confidence: 0 };
    });
    return results;
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] categorizeTransactionsBatch error:', e);
    toSendToAI.forEach(({ index }) => {
      if (!results[index]) results[index] = { category: 'other', confidence: 0 };
    });
    return results;
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

export async function getCpaNotes(params: {
  totalIncome: number;
  totalExpenses: number;
  totalDeductible: number;
  warnings?: Array<{ title: string; body: string }>;
}): Promise<string | null> {
  if (!hasOpenAIKey || !OPENAI_API_KEY) return null;
  try {
    const warnStr = params.warnings?.length
      ? params.warnings.map((w) => `${w.title}: ${w.body}`).join('; ')
      : 'None';
    const prompt = `Based on these business numbers, write a short CPA-ready note (~80 words) summarizing key points for tax prep:
Income: $${params.totalIncome.toFixed(2)}, Expenses: $${params.totalExpenses.toFixed(2)}, Deductible: $${params.totalDeductible.toFixed(2)}
Warnings: ${warnStr}
Be factual and concise. No legal advice.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function getTaxTips(params: {
  totalIncome: number;
  totalExpenses: number;
  totalDeductible: number;
}): Promise<string | null> {
  if (!hasOpenAIKey || !OPENAI_API_KEY) return null;
  try {
    const prompt = `Based on these business numbers (no raw transactions), give 2-3 brief tax tips in plain English (~100 words max):
Income: $${params.totalIncome.toFixed(2)}
Expenses: $${params.totalExpenses.toFixed(2)}
Deductible: $${params.totalDeductible.toFixed(2)}
Be concise and practical. No legal advice.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export type ReceiptProcessResult = {
  vendor: string | null;
  date: string | null;
  amount: number | null;
  category: string | null;
  items: string[];
  notes: string | null;
  rawText?: string | null;
};

const receiptProcessSchema = z.object({
  vendor: z.string().nullable(),
  date: z.string().nullable(),
  amount: z.number().positive().nullable(),
  category: z.string().nullable(),
  items: z.array(z.string()).max(10),
  notes: z.string().nullable(),
  rawText: z.string().nullable().optional(),
});

export async function processReceiptImage(params: {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}): Promise<ReceiptProcessResult> {
  const fallback: ReceiptProcessResult = {
    vendor: null,
    date: null,
    amount: null,
    category: null,
    items: [],
    notes: null,
    rawText: null,
  };

  if (!hasOpenAIKey || !OPENAI_API_KEY) {
    return fallback;
  }

  const dataUrl = `data:${params.mimeType};base64,${params.imageBase64}`;

  const prompt = `Extract receipt data from this image. Return ONLY valid JSON, no other text.

Format:
{"vendor":"Store Name","date":"YYYY-MM-DD","amount":12.99,"category":"meals","items":["Item 1","Item 2"],"notes":"subtotal/tax info if relevant","rawText":"optional OCR snippet"}

Rules:
- vendor: store/merchant name or null
- date: YYYY-MM-DD or null
- amount: total amount as positive number or null
- category: MUST be one of: ${RECEIPT_EXPENSE_CATS} (use "other" if unsure)
- items: max 10 line items as strings
- notes: short summary (subtotal/tax/total) or null
- rawText: optional raw OCR if useful`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[OpenAI] processReceiptImage API error:', res.status);
      return fallback;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const result = receiptProcessSchema.safeParse(parsed);
    if (!result.success) return fallback;

    const r = result.data;
    const validCats = RECEIPT_EXPENSE_CATS.split(', ').map((c) => c.trim());
    const category = r.category && validCats.includes(r.category) ? r.category : 'other';

    return {
      vendor: r.vendor || null,
      date: r.date || null,
      amount: r.amount ?? null,
      category,
      items: (r.items ?? []).slice(0, 10),
      notes: r.notes || null,
      rawText: r.rawText ?? null,
    };
  } catch (e) {
    if (__DEV__) console.warn('[OpenAI] processReceiptImage error:', e);
    return fallback;
  }
}
