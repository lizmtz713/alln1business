// OpenAI Integration Service
// Real AI-powered business assistant

import { ExpenseCategory } from '../types';

// ===========================================
// CONFIGURATION
// ===========================================

// Store API key securely (use expo-secure-store in production)
let OPENAI_API_KEY: string | null = null;

export function setOpenAIKey(key: string) {
  OPENAI_API_KEY = key;
}

export function hasOpenAIKey(): boolean {
  return OPENAI_API_KEY !== null && OPENAI_API_KEY.length > 0;
}

// ===========================================
// SYSTEM PROMPTS
// ===========================================

const CFO_SYSTEM_PROMPT = `You are an AI CFO and business advisor for small business owners, freelancers, and entrepreneurs. You provide expert advice on:

- Tax deductions and tax planning
- Bookkeeping and expense categorization
- Business structures (LLC, S-Corp, Sole Prop)
- Cash flow management
- Quarterly estimated taxes
- Business law basics
- Financial best practices

IMPORTANT GUIDELINES:
1. Be warm, encouraging, and never condescending
2. Use plain English, not jargon
3. Give specific, actionable advice
4. When discussing taxes, note that rules vary by situation and recommend a CPA for complex cases
5. Use emojis sparingly but effectively
6. Format responses with headers and bullet points for readability
7. If asked about something outside business/finance, politely redirect

KNOWLEDGE:
- Quarterly tax due dates: April 15, June 15, September 15, January 15
- 2024 standard mileage rate: 67 cents per mile
- Home office simplified method: $5/sq ft, max 300 sq ft
- Business meals: 50% deductible
- Self-employment tax: 15.3% (12.4% Social Security + 2.9% Medicare)
- SEP-IRA contribution limit: 25% of net self-employment income, max $66,000
- S-Corp reasonable salary requirement for self-employment tax savings

Always be helpful and make the user feel confident about their business finances.`;

const RECEIPT_ANALYSIS_PROMPT = `You are analyzing a receipt image. Extract the following information:
1. Vendor/Store name
2. Total amount
3. Date of purchase
4. Category (choose from: office_supplies, equipment, travel, meals, utilities, rent, marketing, professional_services, insurance, taxes, inventory, shipping, software, other)
5. Is this likely a business expense? (yes/no)
6. Is this tax deductible? If yes, explain why briefly.

Respond in JSON format:
{
  "vendor": "string or null",
  "amount": number or null,
  "date": "MM/DD/YYYY or null",
  "category": "category_string",
  "isBusinessExpense": boolean,
  "taxDeductible": boolean,
  "deductionReason": "string or null",
  "confidence": number between 0 and 1
}`;

const EXPENSE_PARSER_PROMPT = `Parse this natural language expense description and extract:
1. Amount (number)
2. Vendor/Store name
3. Category
4. Description/purpose

Respond in JSON format:
{
  "amount": number or null,
  "vendor": "string or null", 
  "category": "office_supplies|equipment|travel|meals|utilities|rent|marketing|professional_services|insurance|taxes|inventory|shipping|software|other",
  "description": "string or null"
}`;

// ===========================================
// CHAT API
// ===========================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: {
    businessType?: string;
    monthlyRevenue?: number;
    totalExpenses?: number;
    totalDeductions?: number;
  }
): Promise<ChatResponse> {
  if (!OPENAI_API_KEY) {
    // Fallback to local AI service if no API key
    const { getAIResponse } = await import('./aiService');
    return {
      success: true,
      message: getAIResponse(userMessage, context),
    };
  }

  try {
    // Build context string
    let contextString = '';
    if (context) {
      contextString = `\n\nUSER CONTEXT:
- Business type: ${context.businessType || 'Not specified'}
- Monthly revenue: ${context.monthlyRevenue ? `$${context.monthlyRevenue.toLocaleString()}` : 'Not tracked'}
- Monthly expenses: ${context.totalExpenses ? `$${context.totalExpenses.toLocaleString()}` : 'Not tracked'}
- Tracked deductions: ${context.totalDeductions ? `$${context.totalDeductions.toLocaleString()}` : 'None yet'}`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: CFO_SYSTEM_PROMPT + contextString },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective and capable
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      message: data.choices[0].message.content,
    };
  } catch (error: any) {
    console.error('OpenAI chat error:', error);
    // Fallback to local
    const { getAIResponse } = await import('./aiService');
    return {
      success: true,
      message: getAIResponse(userMessage, context),
    };
  }
}

// ===========================================
// RECEIPT OCR + ANALYSIS
// ===========================================

interface ReceiptAnalysis {
  vendor: string | null;
  amount: number | null;
  date: string | null;
  category: ExpenseCategory;
  isBusinessExpense: boolean;
  taxDeductible: boolean;
  deductionReason: string | null;
  confidence: number;
}

export async function analyzeReceiptImage(
  base64Image: string
): Promise<ReceiptAnalysis> {
  if (!OPENAI_API_KEY) {
    // Fallback to local mock
    const { analyzeReceipt } = await import('./aiService');
    const result = analyzeReceipt('mock receipt text');
    return {
      vendor: result.vendor,
      amount: result.amount,
      date: result.date,
      category: result.suggestedCategory,
      isBusinessExpense: true,
      taxDeductible: result.taxDeductible,
      deductionReason: result.deductionReason || null,
      confidence: result.confidence,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: RECEIPT_ANALYSIS_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: 'Analyze this receipt and extract the information.',
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Receipt analysis failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        vendor: parsed.vendor,
        amount: parsed.amount,
        date: parsed.date,
        category: parsed.category || 'other',
        isBusinessExpense: parsed.isBusinessExpense ?? true,
        taxDeductible: parsed.taxDeductible ?? false,
        deductionReason: parsed.deductionReason,
        confidence: parsed.confidence ?? 0.8,
      };
    }
    
    throw new Error('Could not parse receipt analysis');
  } catch (error) {
    console.error('Receipt analysis error:', error);
    // Fallback
    const { analyzeReceipt } = await import('./aiService');
    const result = analyzeReceipt('');
    return {
      vendor: null,
      amount: null,
      date: null,
      category: 'other',
      isBusinessExpense: true,
      taxDeductible: false,
      deductionReason: null,
      confidence: 0.3,
    };
  }
}

// ===========================================
// NATURAL LANGUAGE EXPENSE PARSING
// ===========================================

interface ParsedExpense {
  amount: number | null;
  vendor: string | null;
  category: ExpenseCategory;
  description: string | null;
}

export async function parseExpense(input: string): Promise<ParsedExpense> {
  if (!OPENAI_API_KEY) {
    const { parseNaturalLanguageExpense } = await import('./aiService');
    const result = parseNaturalLanguageExpense(input);
    return {
      amount: result.amount,
      vendor: result.vendor,
      category: result.category,
      description: result.description,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: EXPENSE_PARSER_PROMPT },
          { role: 'user', content: input },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('Expense parsing failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        amount: parsed.amount,
        vendor: parsed.vendor,
        category: parsed.category || 'other',
        description: parsed.description,
      };
    }
    
    throw new Error('Could not parse expense');
  } catch (error) {
    console.error('Expense parsing error:', error);
    const { parseNaturalLanguageExpense } = await import('./aiService');
    return parseNaturalLanguageExpense(input);
  }
}

// ===========================================
// TAX DOCUMENT GENERATION
// ===========================================

export async function generateTaxSummary(
  receipts: any[],
  bills: any[],
  businessInfo: any
): Promise<string> {
  const totalExpenses = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const deductibleExpenses = receipts
    .filter(r => r.taxDeductible)
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const byCategory = receipts.reduce((acc, r) => {
    const cat = r.category || 'other';
    acc[cat] = (acc[cat] || 0) + (r.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const prompt = `Generate a professional tax summary document for a small business with this data:

Business: ${businessInfo.businessName || 'Small Business'}
Type: ${businessInfo.businessType || 'Sole Proprietor'}
Year: ${new Date().getFullYear()}

Total Expenses: $${totalExpenses.toFixed(2)}
Tax Deductible Expenses: $${deductibleExpenses.toFixed(2)}

Expenses by Category:
${Object.entries(byCategory).map(([cat, amt]) => `- ${cat}: $${(amt as number).toFixed(2)}`).join('\n')}

Total Receipts: ${receipts.length}
Monthly Bills Tracked: ${bills.length}

Generate a clean, professional summary that could be shared with an accountant. Include:
1. Executive summary
2. Expense breakdown by category
3. Potential deductions
4. Recommendations for tax filing
5. Any red flags or items to review`;

  if (!OPENAI_API_KEY) {
    return `# Tax Summary ${new Date().getFullYear()}

## Overview
- Total Expenses: $${totalExpenses.toFixed(2)}
- Tax Deductible: $${deductibleExpenses.toFixed(2)}
- Potential Tax Savings: ~$${(deductibleExpenses * 0.25).toFixed(2)}

## Expenses by Category
${Object.entries(byCategory).map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${(amt as number).toFixed(2)}`).join('\n')}

## Receipts
${receipts.length} receipts tracked and categorized.

## Recommendations
1. Review all expenses with your CPA
2. Ensure you have documentation for expenses over $75
3. Consider quarterly estimated tax payments

Generated by Alln1 Business`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional accountant generating tax documents.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('Tax summary generation failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Tax summary error:', error);
    return `# Tax Summary - Error generating full report. Please try again.`;
  }
}
