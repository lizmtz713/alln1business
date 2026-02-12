const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const hasOpenAIKey = Boolean(OPENAI_API_KEY);

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
