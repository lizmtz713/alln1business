// Business AI Service
// Dual provider support (OpenAI + Anthropic) with automatic failover
// AI CFO, receipt analysis, tax advice for small businesses

import Constants from 'expo-constants';
import { ExpenseCategory } from '../types';

// ============================================
// CONFIGURATION
// ============================================

type Provider = 'openai' | 'anthropic';
type ModelTier = 'fast' | 'standard' | 'powerful';

interface ProviderConfig {
  apiKey: string;
  models: Record<ModelTier, string>;
}

interface AIConfig {
  primaryProvider: Provider;
  providers: Record<Provider, ProviderConfig>;
}

let runtimeKeys: { openai?: string; anthropic?: string } = {};

export const setAPIKey = (provider: Provider, key: string) => {
  runtimeKeys[provider] = key;
};

export const hasAPIKey = (provider?: Provider): boolean => {
  const config = getConfig();
  if (provider) {
    return !!config.providers[provider].apiKey;
  }
  return !!config.providers.openai.apiKey || !!config.providers.anthropic.apiKey;
};

const getConfig = (): AIConfig => {
  const openaiKey = runtimeKeys.openai || 
    Constants.expoConfig?.extra?.openaiApiKey || 
    process.env.OPENAI_API_KEY || '';
  const anthropicKey = runtimeKeys.anthropic || 
    Constants.expoConfig?.extra?.anthropicApiKey || 
    process.env.ANTHROPIC_API_KEY || '';
  
  // Prefer Anthropic for nuanced business advice
  const primaryProvider: Provider = anthropicKey ? 'anthropic' : 'openai';

  return {
    primaryProvider,
    providers: {
      openai: {
        apiKey: openaiKey,
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          powerful: 'gpt-4o',
        },
      },
      anthropic: {
        apiKey: anthropicKey,
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-sonnet-4-20250514',
          powerful: 'claude-sonnet-4-20250514',
        },
      },
    },
  };
};

const getAvailableProviders = (): Provider[] => {
  const config = getConfig();
  const available: Provider[] = [];
  if (config.providers.anthropic.apiKey) available.push('anthropic');
  if (config.providers.openai.apiKey) available.push('openai');
  
  if (available.length > 1 && available[0] !== config.primaryProvider) {
    return [config.primaryProvider, ...available.filter(p => p !== config.primaryProvider)];
  }
  return available;
};

// ============================================
// SYSTEM PROMPTS
// ============================================

const CFO_SYSTEM_PROMPT = `You are an AI CFO and business advisor for small business owners, freelancers, and solopreneurs. Think of yourself as their friendly, expert financial partner.

## Your Expertise
- Tax deductions and tax planning strategies
- Business expense categorization and tracking
- Business structures: LLC, S-Corp, C-Corp, Sole Proprietor — when each makes sense
- Cash flow management and runway planning
- Quarterly estimated taxes and avoiding penalties
- Self-employment tax optimization
- Retirement accounts: SEP-IRA, Solo 401(k), SIMPLE IRA
- Financial best practices for small businesses

## Personality
- Warm, encouraging, and never condescending
- Plain English — no unnecessary jargon
- Specific, actionable advice
- Realistic about when they need a CPA
- Celebratory about their wins ("Great job tracking that!")

## Critical Tax Knowledge (2024)
- Quarterly estimated tax due dates: April 15, June 15, September 15, January 15
- Standard mileage rate: 67 cents per mile
- Home office simplified method: $5/sq ft, max 300 sq ft ($1,500 max)
- Business meals: 50% deductible (must document business purpose)
- Self-employment tax: 15.3% (12.4% SS + 2.9% Medicare)
- SE tax deduction: Deduct 50% of SE tax from income
- QBI deduction: Up to 20% of qualified business income
- SEP-IRA limit: 25% of net self-employment income, max $69,000
- Solo 401(k): Up to $23,000 employee + 25% employer contribution

## Common Deductions to Highlight
- Home office (regular and exclusive use)
- Health insurance premiums (self-employed)
- Business travel (away from home overnight)
- Professional development and courses
- Software subscriptions
- Marketing and advertising
- Professional services (accountant, lawyer, coach)
- Office supplies and equipment
- Business phone and internet (% of use)

## Rules
1. Always note that tax situations vary — recommend a CPA for complex cases
2. Format responses with clear headers and bullet points
3. Give dollar amounts when estimating savings
4. Celebrate their progress tracking expenses
5. Be proactive about opportunities they might miss`;

const RECEIPT_ANALYSIS_PROMPT = `Analyze this receipt and extract:
1. Vendor/store name
2. Total amount
3. Date
4. Best expense category
5. Whether it's a valid business deduction
6. Why it's deductible (if applicable)

Be accurate. If something is unclear, say so.
Respond in JSON only.`;

const EXPENSE_PARSER_PROMPT = `Parse this natural language expense description.
Extract: amount, vendor, category, description.
Categories: office_supplies, equipment, travel, meals, utilities, rent, marketing, professional_services, insurance, taxes, inventory, shipping, software, other
Respond in JSON only.`;

// ============================================
// API CALLS
// ============================================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  provider: Provider;
  model: string;
  error?: string;
}

const callOpenAI = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model,
  };
};

const callAnthropic = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model,
  };
};

const callWithFailover = async (
  systemPrompt: string,
  messages: Message[],
  tier: ModelTier = 'standard',
  maxTokens: number = 800,
  temperature: number = 0.7
): Promise<AIResponse> => {
  const config = getConfig();
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    return {
      content: '',
      provider: 'openai',
      model: '',
      error: 'No API keys configured',
    };
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    const providerConfig = config.providers[provider];
    const model = providerConfig.models[tier];

    try {
      if (provider === 'openai') {
        return await callOpenAI(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      } else {
        return await callAnthropic(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      }
    } catch (error) {
      console.warn(`${provider} failed, trying next...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return {
    content: '',
    provider: providers[0],
    model: '',
    error: lastError?.message || 'All providers failed',
  };
};

// ============================================
// PUBLIC API: CFO CHAT
// ============================================

export interface BusinessContext {
  businessType?: string;
  businessName?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  totalDeductions?: number;
  state?: string;
  yearsInBusiness?: number;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  provider?: Provider;
  error?: string;
}

export const chat = async (
  userMessage: string,
  conversationHistory: Message[] = [],
  context?: BusinessContext
): Promise<ChatResponse> => {
  let contextStr = '';
  if (context) {
    const parts: string[] = [];
    if (context.businessName) parts.push(`Business: ${context.businessName}`);
    if (context.businessType) parts.push(`Type: ${context.businessType}`);
    if (context.state) parts.push(`State: ${context.state}`);
    if (context.monthlyRevenue) parts.push(`Monthly revenue: $${context.monthlyRevenue.toLocaleString()}`);
    if (context.monthlyExpenses) parts.push(`Monthly expenses: $${context.monthlyExpenses.toLocaleString()}`);
    if (context.totalDeductions) parts.push(`Tracked deductions YTD: $${context.totalDeductions.toLocaleString()}`);
    if (context.yearsInBusiness) parts.push(`In business: ${context.yearsInBusiness} years`);
    
    if (parts.length) {
      contextStr = `\n\n## User's Business\n${parts.join('\n')}`;
    }
  }

  const systemPrompt = CFO_SYSTEM_PROMPT + contextStr;
  const messages: Message[] = [
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const response = await callWithFailover(systemPrompt, messages, 'standard', 1000, 0.7);

  if (response.error) {
    return {
      success: true,
      message: getLocalChatResponse(userMessage),
    };
  }

  return {
    success: true,
    message: response.content,
    provider: response.provider,
  };
};

// ============================================
// PUBLIC API: RECEIPT ANALYSIS
// ============================================

export interface ReceiptAnalysis {
  vendor: string | null;
  amount: number | null;
  date: string | null;
  category: ExpenseCategory;
  isBusinessExpense: boolean;
  taxDeductible: boolean;
  deductionReason: string | null;
  confidence: number;
}

export const analyzeReceipt = async (
  receiptText: string
): Promise<ReceiptAnalysis> => {
  const prompt = `${RECEIPT_ANALYSIS_PROMPT}

Receipt text/content:
${receiptText}

Respond in JSON:
{
  "vendor": "string or null",
  "amount": number or null,
  "date": "MM/DD/YYYY or null",
  "category": "office_supplies|equipment|travel|meals|utilities|rent|marketing|professional_services|insurance|taxes|inventory|shipping|software|other",
  "isBusinessExpense": boolean,
  "taxDeductible": boolean,
  "deductionReason": "string or null",
  "confidence": 0.0-1.0
}`;

  const response = await callWithFailover(
    'You are a receipt analyzer. Respond only in valid JSON.',
    [{ role: 'user', content: prompt }],
    'fast',
    400,
    0.3
  );

  if (response.error) {
    return getLocalReceiptAnalysis(receiptText);
  }

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
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
  } catch (e) {
    console.error('Receipt analysis parse error:', e);
  }

  return getLocalReceiptAnalysis(receiptText);
};

// ============================================
// PUBLIC API: EXPENSE PARSING
// ============================================

export interface ParsedExpense {
  amount: number | null;
  vendor: string | null;
  category: ExpenseCategory;
  description: string | null;
}

export const parseExpense = async (input: string): Promise<ParsedExpense> => {
  const prompt = `${EXPENSE_PARSER_PROMPT}

Input: "${input}"

Respond in JSON:
{
  "amount": number or null,
  "vendor": "string or null",
  "category": "category_string",
  "description": "string or null"
}`;

  const response = await callWithFailover(
    'You parse expense descriptions. Respond only in valid JSON.',
    [{ role: 'user', content: prompt }],
    'fast',
    200,
    0.3
  );

  if (response.error) {
    return parseLocalExpense(input);
  }

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        amount: parsed.amount,
        vendor: parsed.vendor,
        category: parsed.category || 'other',
        description: parsed.description,
      };
    }
  } catch (e) {
    console.error('Expense parse error:', e);
  }

  return parseLocalExpense(input);
};

// ============================================
// PUBLIC API: TAX ADVICE
// ============================================

export interface TaxAdvice {
  estimatedTax: number;
  nextDueDate: string;
  recommendations: string[];
  deductionOpportunities: string[];
  warningsOrAlerts: string[];
}

export const getTaxAdvice = async (
  income: number,
  expenses: number,
  deductions: number,
  businessType: string,
  state: string
): Promise<TaxAdvice> => {
  const netIncome = income - expenses;
  const seTax = netIncome > 0 ? netIncome * 0.153 * 0.9235 : 0;
  const taxableIncome = netIncome - (seTax / 2) - deductions;
  const estimatedFederalTax = taxableIncome > 0 ? taxableIncome * 0.22 : 0;
  const totalEstimatedTax = estimatedFederalTax + seTax;

  const prompt = `Provide tax advice for:
- Business type: ${businessType}
- State: ${state}
- Annual income: $${income.toLocaleString()}
- Annual expenses: $${expenses.toLocaleString()}
- Net income: $${netIncome.toLocaleString()}
- Tracked deductions: $${deductions.toLocaleString()}
- Estimated SE tax: $${seTax.toFixed(2)}
- Estimated total tax: $${totalEstimatedTax.toFixed(2)}

Provide in JSON:
{
  "estimatedTax": number,
  "nextDueDate": "Month Day, Year",
  "recommendations": ["advice1", "advice2", "advice3"],
  "deductionOpportunities": ["opportunity1", "opportunity2"],
  "warningsOrAlerts": ["warning if any"]
}`;

  const response = await callWithFailover(
    CFO_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    'standard',
    600,
    0.5
  );

  if (response.error) {
    return getLocalTaxAdvice(netIncome, totalEstimatedTax);
  }

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Tax advice parse error:', e);
  }

  return getLocalTaxAdvice(netIncome, totalEstimatedTax);
};

// ============================================
// PUBLIC API: TAX SUMMARY GENERATION
// ============================================

export const generateTaxSummary = async (
  receipts: any[],
  bills: any[],
  businessInfo: BusinessContext
): Promise<string> => {
  const totalExpenses = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const deductibleExpenses = receipts
    .filter(r => r.taxDeductible)
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  
  const byCategory = receipts.reduce((acc, r) => {
    const cat = r.category || 'other';
    acc[cat] = (acc[cat] || 0) + (r.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const prompt = `Generate a professional tax summary document:

Business: ${businessInfo.businessName || 'Small Business'}
Type: ${businessInfo.businessType || 'Sole Proprietor'}
Year: ${new Date().getFullYear()}

Total Expenses Tracked: $${totalExpenses.toFixed(2)}
Tax Deductible Expenses: $${deductibleExpenses.toFixed(2)}

By Category:
${Object.entries(byCategory).map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${(amt as number).toFixed(2)}`).join('\n')}

Total Receipts: ${receipts.length}
Monthly Bills: ${bills.length}

Create a clean summary for sharing with an accountant. Include:
1. Executive summary
2. Expense breakdown
3. Potential tax savings
4. Items to review
5. Next steps`;

  const response = await callWithFailover(
    'You generate professional tax documents. Be thorough but clear.',
    [{ role: 'user', content: prompt }],
    'powerful',
    1500,
    0.5
  );

  if (response.error) {
    return generateLocalTaxSummary(totalExpenses, deductibleExpenses, byCategory, receipts.length, businessInfo);
  }

  return response.content;
};

// ============================================
// LOCAL FALLBACKS
// ============================================

const getLocalChatResponse = (message: string): string => {
  const q = message.toLowerCase();

  if (q.includes('deduct') || q.includes('deduction') || q.includes('write off')) {
    return `## 💰 Common Business Deductions

Great question! Here are the main categories:

**100% Deductible:**
- Office supplies & equipment
- Software subscriptions
- Business travel
- Professional development
- Marketing & advertising
- Professional services (accountant, lawyer)
- Business insurance
- Home office (if you qualify)

**50% Deductible:**
- Business meals (must document purpose!)

**Partially Deductible:**
- Phone & internet (% used for business)
- Vehicle (mileage or actual expenses)

**Pro tip:** Keep receipts for everything over $75, and document the business purpose for meals and travel.

Need specifics on any of these?`;
  }

  if (q.includes('quarterly') || q.includes('estimated tax')) {
    return `## 📅 Quarterly Estimated Taxes

If you're self-employed and expect to owe $1,000+ in taxes, you need to pay quarterly!

**2024 Due Dates:**
- Q1: April 15, 2024
- Q2: June 17, 2024
- Q3: September 16, 2024
- Q4: January 15, 2025

**How much to pay:**
A safe harbor is paying 100% of last year's tax (110% if income > $150k) divided by 4.

Or estimate: (Net Income × 30%) ÷ 4

This covers both income tax (~22%) and self-employment tax (~15.3%).

**Pro tip:** Set aside 25-30% of every payment you receive in a separate savings account!`;
  }

  if (q.includes('llc') || q.includes('s-corp') || q.includes('business structure')) {
    return `## 🏢 Business Structure Options

**Sole Proprietor** (Default)
- No paperwork to start
- Personal liability
- All income on your personal return
- Best for: Testing a business idea, low risk

**LLC (Limited Liability Company)**
- Liability protection
- Pass-through taxation
- Flexible management
- Best for: Most small businesses, some assets to protect

**S-Corp (or LLC taxed as S-Corp)**
- Can save on self-employment tax
- Must pay yourself "reasonable salary"
- More paperwork
- Best for: Consistent profit > $50k/year

**Rule of thumb:** Consider S-Corp election when net profit exceeds $50k consistently. The SE tax savings outweigh the extra admin.

Want me to break down the numbers for your situation?`;
  }

  if (q.includes('home office')) {
    return `## 🏠 Home Office Deduction

Two methods:

**Simplified Method:**
- $5 per square foot
- Max 300 sq ft = $1,500 max deduction
- No depreciation calculations
- Easy! Just measure your space

**Actual Expense Method:**
- Calculate % of home used for business
- Deduct that % of: rent/mortgage interest, utilities, insurance, repairs
- Can be bigger, but more work
- Can claim depreciation (complicates future home sale)

**Requirements (BOTH methods):**
- Regular and exclusive use for business
- Principal place of business OR where you meet clients

**Pro tip:** The simplified method is great for most people. Less audit risk, less math!`;
  }

  return `## 👋 Your AI CFO is Here!

I can help you with:

💰 **Tax Questions**
- "What can I deduct?"
- "How do quarterly taxes work?"
- "Should I form an LLC?"

📊 **Business Finances**
- "How much should I set aside for taxes?"
- "What's a good profit margin?"
- "How do I track mileage?"

🧾 **Expense Tracking**
- "Is [X] tax deductible?"
- "How do I categorize [X]?"
- "What records do I need to keep?"

Just ask! I'm here to make your finances less stressful. 💪`;
};

const getLocalReceiptAnalysis = (text: string): ReceiptAnalysis => {
  const lowerText = text.toLowerCase();
  
  // Try to extract amount
  const amountMatch = text.match(/\$?(\d+\.?\d*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  // Guess category from keywords
  let category: ExpenseCategory = 'other';
  if (lowerText.includes('office') || lowerText.includes('staples')) category = 'office_supplies';
  else if (lowerText.includes('uber') || lowerText.includes('lyft') || lowerText.includes('airline')) category = 'travel';
  else if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('coffee')) category = 'meals';
  else if (lowerText.includes('adobe') || lowerText.includes('microsoft') || lowerText.includes('software')) category = 'software';

  return {
    vendor: null,
    amount,
    date: null,
    category,
    isBusinessExpense: true,
    taxDeductible: true,
    deductionReason: category === 'meals' ? 'Business meals are 50% deductible' : '100% deductible business expense',
    confidence: 0.5,
  };
};

const parseLocalExpense = (input: string): ParsedExpense => {
  const amountMatch = input.match(/\$?(\d+\.?\d*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  
  const lowerInput = input.toLowerCase();
  let category: ExpenseCategory = 'other';
  
  if (lowerInput.includes('office') || lowerInput.includes('supplies')) category = 'office_supplies';
  else if (lowerInput.includes('travel') || lowerInput.includes('uber') || lowerInput.includes('flight')) category = 'travel';
  else if (lowerInput.includes('lunch') || lowerInput.includes('dinner') || lowerInput.includes('coffee')) category = 'meals';
  else if (lowerInput.includes('software') || lowerInput.includes('subscription')) category = 'software';
  else if (lowerInput.includes('marketing') || lowerInput.includes('ads')) category = 'marketing';

  return {
    amount,
    vendor: null,
    category,
    description: input,
  };
};

const getLocalTaxAdvice = (netIncome: number, estimatedTax: number): TaxAdvice => {
  const today = new Date();
  const quarterDates = [
    { q: 1, date: 'April 15' },
    { q: 2, date: 'June 17' },
    { q: 3, date: 'September 16' },
    { q: 4, date: 'January 15' },
  ];
  
  const month = today.getMonth();
  let nextDue = quarterDates[0].date;
  if (month >= 1 && month < 4) nextDue = quarterDates[0].date;
  else if (month >= 4 && month < 6) nextDue = quarterDates[1].date;
  else if (month >= 6 && month < 9) nextDue = quarterDates[2].date;
  else nextDue = quarterDates[3].date;

  return {
    estimatedTax: Math.round(estimatedTax),
    nextDueDate: nextDue + ', ' + (month >= 9 ? today.getFullYear() + 1 : today.getFullYear()),
    recommendations: [
      'Set aside 25-30% of each payment for taxes',
      'Consider opening a SEP-IRA to reduce taxable income',
      'Track all business expenses — even small ones add up',
    ],
    deductionOpportunities: [
      'Home office deduction (if you work from home)',
      'Health insurance premiums (if self-employed)',
      'Professional development and courses',
    ],
    warningsOrAlerts: netIncome > 50000 ? 
      ['Consider S-Corp election — could save $3,000+ in SE tax'] : [],
  };
};

const generateLocalTaxSummary = (
  totalExpenses: number,
  deductibleExpenses: number,
  byCategory: Record<string, number>,
  receiptCount: number,
  businessInfo: BusinessContext
): string => {
  const potentialSavings = deductibleExpenses * 0.25;
  
  return `# Tax Summary ${new Date().getFullYear()}
## ${businessInfo.businessName || 'Business'} (${businessInfo.businessType || 'Sole Proprietor'})

---

## Executive Summary
- **Total Expenses Tracked:** $${totalExpenses.toFixed(2)}
- **Tax Deductible Amount:** $${deductibleExpenses.toFixed(2)}
- **Estimated Tax Savings:** ~$${potentialSavings.toFixed(2)}
- **Receipts Documented:** ${receiptCount}

---

## Expense Breakdown
${Object.entries(byCategory)
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .map(([cat, amt]) => `- **${cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:** $${(amt as number).toFixed(2)}`)
  .join('\n')}

---

## Next Steps
1. ✅ Review all categorizations with your CPA
2. ✅ Ensure documentation for expenses over $75
3. ✅ Keep this summary with your tax records
4. ✅ Schedule quarterly tax payment if needed

---

*Generated by Alln1 Business • ${new Date().toLocaleDateString()}*`;
};

// ============================================
// EXPORTS
// ============================================

export const BusinessAI = {
  chat,
  analyzeReceipt,
  parseExpense,
  getTaxAdvice,
  generateTaxSummary,
  setAPIKey,
  hasAPIKey,
};

export default BusinessAI;
