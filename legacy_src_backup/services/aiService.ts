// AI Service - Smart Business Assistant
// This would connect to OpenAI/Claude in production

import { ExpenseCategory, Receipt } from '../types';

// ===========================================
// RECEIPT OCR & AUTO-CATEGORIZATION
// ===========================================

interface OCRResult {
  vendor: string | null;
  amount: number | null;
  date: string | null;
  suggestedCategory: ExpenseCategory;
  confidence: number;
  taxDeductible: boolean;
  deductionReason?: string;
}

// Vendor to category mapping (would be ML model in production)
const VENDOR_CATEGORIES: Record<string, { category: ExpenseCategory; deductible: boolean; reason?: string }> = {
  // Office Supplies
  'staples': { category: 'office_supplies', deductible: true, reason: 'Office supplies are 100% deductible' },
  'office depot': { category: 'office_supplies', deductible: true, reason: 'Office supplies are 100% deductible' },
  'officemax': { category: 'office_supplies', deductible: true, reason: 'Office supplies are 100% deductible' },
  'amazon': { category: 'office_supplies', deductible: true, reason: 'Business purchases are deductible' },
  
  // Software/Tech
  'adobe': { category: 'software', deductible: true, reason: 'Software subscriptions are 100% deductible' },
  'microsoft': { category: 'software', deductible: true, reason: 'Software subscriptions are 100% deductible' },
  'google': { category: 'software', deductible: true, reason: 'Software/cloud services are 100% deductible' },
  'dropbox': { category: 'software', deductible: true, reason: 'Cloud storage is 100% deductible' },
  'zoom': { category: 'software', deductible: true, reason: 'Communication tools are 100% deductible' },
  'slack': { category: 'software', deductible: true, reason: 'Business software is 100% deductible' },
  'canva': { category: 'software', deductible: true, reason: 'Design software is 100% deductible' },
  
  // Meals
  'starbucks': { category: 'meals', deductible: true, reason: 'Business meals are 50% deductible' },
  'uber eats': { category: 'meals', deductible: true, reason: 'Business meals are 50% deductible' },
  'doordash': { category: 'meals', deductible: true, reason: 'Business meals are 50% deductible' },
  'grubhub': { category: 'meals', deductible: true, reason: 'Business meals are 50% deductible' },
  'chipotle': { category: 'meals', deductible: true, reason: 'Business meals are 50% deductible' },
  
  // Travel
  'uber': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'lyft': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'delta': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'united': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'american airlines': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'southwest': { category: 'travel', deductible: true, reason: 'Business travel is 100% deductible' },
  'airbnb': { category: 'travel', deductible: true, reason: 'Business lodging is 100% deductible' },
  'marriott': { category: 'travel', deductible: true, reason: 'Business lodging is 100% deductible' },
  'hilton': { category: 'travel', deductible: true, reason: 'Business lodging is 100% deductible' },
  'hertz': { category: 'travel', deductible: true, reason: 'Business car rental is 100% deductible' },
  'enterprise': { category: 'travel', deductible: true, reason: 'Business car rental is 100% deductible' },
  
  // Utilities
  'at&t': { category: 'utilities', deductible: true, reason: 'Business phone/internet is deductible (% used for business)' },
  'verizon': { category: 'utilities', deductible: true, reason: 'Business phone/internet is deductible (% used for business)' },
  't-mobile': { category: 'utilities', deductible: true, reason: 'Business phone/internet is deductible (% used for business)' },
  'comcast': { category: 'utilities', deductible: true, reason: 'Business internet is deductible (% used for business)' },
  'spectrum': { category: 'utilities', deductible: true, reason: 'Business internet is deductible (% used for business)' },
  
  // Marketing
  'facebook': { category: 'marketing', deductible: true, reason: 'Advertising is 100% deductible' },
  'meta': { category: 'marketing', deductible: true, reason: 'Advertising is 100% deductible' },
  'google ads': { category: 'marketing', deductible: true, reason: 'Advertising is 100% deductible' },
  'mailchimp': { category: 'marketing', deductible: true, reason: 'Marketing tools are 100% deductible' },
  'constant contact': { category: 'marketing', deductible: true, reason: 'Marketing tools are 100% deductible' },
  'vistaprint': { category: 'marketing', deductible: true, reason: 'Business cards/materials are 100% deductible' },
  
  // Professional Services
  'quickbooks': { category: 'professional_services', deductible: true, reason: 'Accounting software is 100% deductible' },
  'turbotax': { category: 'professional_services', deductible: true, reason: 'Tax prep is 100% deductible' },
  'legalzoom': { category: 'professional_services', deductible: true, reason: 'Legal services are 100% deductible' },
  
  // Shipping
  'usps': { category: 'shipping', deductible: true, reason: 'Shipping is 100% deductible' },
  'ups': { category: 'shipping', deductible: true, reason: 'Shipping is 100% deductible' },
  'fedex': { category: 'shipping', deductible: true, reason: 'Shipping is 100% deductible' },
  
  // Gas (for business use)
  'shell': { category: 'travel', deductible: true, reason: 'Business mileage/gas is deductible' },
  'chevron': { category: 'travel', deductible: true, reason: 'Business mileage/gas is deductible' },
  'exxon': { category: 'travel', deductible: true, reason: 'Business mileage/gas is deductible' },
  'bp': { category: 'travel', deductible: true, reason: 'Business mileage/gas is deductible' },
};

export function analyzeReceipt(imageText: string): OCRResult {
  // In production, this would use Google Vision/AWS Textract + GPT
  // For now, simulate smart extraction
  
  const textLower = imageText.toLowerCase();
  
  // Find vendor
  let vendor: string | null = null;
  let category: ExpenseCategory = 'other';
  let deductible = false;
  let reason: string | undefined;
  
  for (const [vendorName, info] of Object.entries(VENDOR_CATEGORIES)) {
    if (textLower.includes(vendorName)) {
      vendor = vendorName.charAt(0).toUpperCase() + vendorName.slice(1);
      category = info.category;
      deductible = info.deductible;
      reason = info.reason;
      break;
    }
  }
  
  // Extract amount (look for dollar amounts)
  const amountMatch = imageText.match(/\$?(\d{1,4})[.,](\d{2})/);
  const amount = amountMatch ? parseFloat(`${amountMatch[1]}.${amountMatch[2]}`) : null;
  
  // Extract date
  const dateMatch = imageText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  const date = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : null;
  
  return {
    vendor,
    amount,
    date,
    suggestedCategory: category,
    confidence: vendor ? 0.85 : 0.4,
    taxDeductible: deductible,
    deductionReason: reason,
  };
}

// ===========================================
// NATURAL LANGUAGE EXPENSE ENTRY
// ===========================================

interface ParsedExpense {
  amount: number | null;
  vendor: string | null;
  category: ExpenseCategory;
  description: string | null;
  date: Date;
}

export function parseNaturalLanguageExpense(input: string): ParsedExpense {
  // "I spent $47.50 at Staples on printer ink"
  // "Uber ride to client meeting $23"
  // "$150 Adobe subscription"
  
  const inputLower = input.toLowerCase();
  
  // Extract amount
  const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  
  // Find vendor/category
  let vendor: string | null = null;
  let category: ExpenseCategory = 'other';
  
  for (const [vendorName, info] of Object.entries(VENDOR_CATEGORIES)) {
    if (inputLower.includes(vendorName)) {
      vendor = vendorName.charAt(0).toUpperCase() + vendorName.slice(1);
      category = info.category;
      break;
    }
  }
  
  // Extract description (everything after "on" or "for")
  const descMatch = input.match(/(?:on|for)\s+(.+?)(?:\s+\$|\s*$)/i);
  const description = descMatch ? descMatch[1] : null;
  
  return {
    amount,
    vendor,
    category,
    description,
    date: new Date(),
  };
}

// ===========================================
// TAX READINESS SCORE
// ===========================================

interface TaxReadinessResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalDeductions: number;
  missingItems: string[];
  recommendations: string[];
  breakdown: {
    documentsScore: number;
    receiptsScore: number;
    categorizationScore: number;
    consistencyScore: number;
  };
}

export function calculateTaxReadiness(
  documentsCount: number,
  receiptsCount: number,
  categorizedReceipts: number,
  monthsWithReceipts: number,
  hasW9: boolean,
  hasInsurance: boolean,
  totalDeductibleAmount: number
): TaxReadinessResult {
  const missingItems: string[] = [];
  const recommendations: string[] = [];
  
  // Documents score (25 points)
  let documentsScore = 0;
  if (hasW9) documentsScore += 12;
  else missingItems.push('W-9 form');
  if (hasInsurance) documentsScore += 8;
  else missingItems.push('Insurance certificate');
  if (documentsCount >= 3) documentsScore += 5;
  
  // Receipts score (25 points)
  let receiptsScore = 0;
  if (receiptsCount >= 50) receiptsScore = 25;
  else if (receiptsCount >= 25) receiptsScore = 20;
  else if (receiptsCount >= 10) receiptsScore = 15;
  else if (receiptsCount >= 5) receiptsScore = 10;
  else {
    receiptsScore = receiptsCount * 2;
    recommendations.push('Keep logging receipts! You need more expense records.');
  }
  
  // Categorization score (25 points)
  const categorizationRate = receiptsCount > 0 ? categorizedReceipts / receiptsCount : 0;
  let categorizationScore = Math.round(categorizationRate * 25);
  if (categorizationRate < 0.8) {
    recommendations.push('Review uncategorized expenses for better tax reporting.');
  }
  
  // Consistency score (25 points) - receipts spread across months
  let consistencyScore = 0;
  if (monthsWithReceipts >= 12) consistencyScore = 25;
  else if (monthsWithReceipts >= 9) consistencyScore = 20;
  else if (monthsWithReceipts >= 6) consistencyScore = 15;
  else if (monthsWithReceipts >= 3) consistencyScore = 10;
  else {
    consistencyScore = monthsWithReceipts * 3;
    recommendations.push('Log expenses consistently throughout the year.');
  }
  
  const score = documentsScore + receiptsScore + categorizationScore + consistencyScore;
  
  let grade: TaxReadinessResult['grade'];
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';
  
  if (totalDeductibleAmount > 0) {
    recommendations.unshift(`💰 You have $${totalDeductibleAmount.toLocaleString()} in potential deductions!`);
  }
  
  return {
    score,
    grade,
    totalDeductions: totalDeductibleAmount,
    missingItems,
    recommendations,
    breakdown: {
      documentsScore,
      receiptsScore,
      categorizationScore,
      consistencyScore,
    },
  };
}

// ===========================================
// SMART INSIGHTS
// ===========================================

interface Insight {
  type: 'alert' | 'tip' | 'achievement' | 'warning';
  title: string;
  message: string;
  action?: string;
  actionScreen?: string;
}

export function generateInsights(
  receipts: Receipt[],
  previousMonthTotal: number,
  currentMonthTotal: number,
  streakDays: number,
  uncategorizedCount: number
): Insight[] {
  const insights: Insight[] = [];
  
  // Spending comparison
  if (previousMonthTotal > 0 && currentMonthTotal > previousMonthTotal * 1.3) {
    const increase = Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100);
    insights.push({
      type: 'warning',
      title: 'Spending Up',
      message: `You've spent ${increase}% more than last month. Review your expenses.`,
      action: 'View Expenses',
      actionScreen: 'Receipts',
    });
  } else if (previousMonthTotal > 0 && currentMonthTotal < previousMonthTotal * 0.7) {
    const decrease = Math.round(((previousMonthTotal - currentMonthTotal) / previousMonthTotal) * 100);
    insights.push({
      type: 'achievement',
      title: 'Great Job!',
      message: `You've reduced spending by ${decrease}% this month.`,
    });
  }
  
  // Streak
  if (streakDays >= 7) {
    insights.push({
      type: 'achievement',
      title: `${streakDays} Day Streak! 🔥`,
      message: 'You\'re building great bookkeeping habits.',
    });
  }
  
  // Uncategorized receipts
  if (uncategorizedCount > 5) {
    insights.push({
      type: 'tip',
      title: 'Categorize Receipts',
      message: `You have ${uncategorizedCount} uncategorized receipts. This helps at tax time!`,
      action: 'Review Now',
      actionScreen: 'Receipts',
    });
  }
  
  // Deduction tip
  const mealReceipts = receipts.filter(r => r.category === 'meals');
  if (mealReceipts.length > 0) {
    const mealTotal = mealReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    insights.push({
      type: 'tip',
      title: 'Meal Deduction',
      message: `You can deduct 50% of business meals. That's $${(mealTotal * 0.5).toFixed(0)} in potential savings!`,
    });
  }
  
  return insights;
}

// ===========================================
// AI CHAT RESPONSES (Enhanced)
// ===========================================

export function getAIResponse(question: string, context?: { 
  totalExpenses?: number;
  topCategory?: string;
  businessType?: string;
}): string {
  const q = question.toLowerCase();
  
  // Deduction questions
  if (q.includes('deductible') || q.includes('deduct') || q.includes('write off')) {
    if (q.includes('home office')) {
      return `🏠 **Home Office Deduction**

You can deduct home office expenses if you use a space **exclusively and regularly** for business.

**Two Methods:**

1. **Simplified Method**
   • $5 per square foot
   • Max 300 sq ft = $1,500/year
   • Easy, no receipts needed

2. **Regular Method**
   • Calculate % of home used for business
   • Deduct that % of: rent/mortgage, utilities, insurance, repairs
   • Requires more record-keeping but often higher deduction

**Pro Tip:** Measure your office space and take a photo for your records!

Would you like help calculating your home office deduction?`;
    }
    
    if (q.includes('car') || q.includes('vehicle') || q.includes('mileage')) {
      return `🚗 **Vehicle & Mileage Deduction**

**Two Options:**

1. **Standard Mileage Rate (Easier)**
   • 2024: 67 cents per business mile
   • Just track your miles
   • Use an app or log

2. **Actual Expenses (More Work)**
   • Track gas, insurance, repairs, depreciation
   • Calculate business use %
   • Often better for expensive vehicles

**What Counts as Business Driving:**
✅ Client meetings
✅ Bank/post office for business
✅ Supply runs
✅ Between job sites
❌ Commuting to your main office

**Pro Tip:** Start tracking mileage NOW. The IRS requires contemporaneous records!`;
    }
    
    if (q.includes('meal') || q.includes('food') || q.includes('dinner') || q.includes('lunch')) {
      return `🍽️ **Business Meals Deduction**

**The Rule:** Business meals are **50% deductible** if:
• You discuss business before, during, or after
• You're present at the meal
• It's not lavish or extravagant

**What to Record:**
• Date and amount
• Who was there
• Business purpose discussed
• Receipt (required for $75+)

**Pro Tips:**
• Write the client/purpose on the receipt immediately
• "Marketing meeting with [Name]" is enough
• Client entertainment (concerts, sports) is NOT deductible since 2018

${context?.totalExpenses ? `\n💡 Based on your records, you have meal expenses that could save you approximately $${((context.totalExpenses * 0.15) * 0.5).toFixed(0)} in deductions!` : ''}`;
    }
    
    return `📋 **Common Business Deductions**

Here are deductions most small business owners can take:

**100% Deductible:**
• Office supplies & equipment
• Software subscriptions
• Professional services (legal, accounting)
• Business insurance
• Marketing & advertising
• Business travel (flights, hotels, rental cars)
• Professional development

**50% Deductible:**
• Business meals

**Partially Deductible (Business %):**
• Phone bill
• Internet
• Home office
• Vehicle expenses

**Pro Tip:** If you're unsure, ask yourself: "Would I have this expense if I didn't have my business?" If no, it's probably deductible!

What specific expense would you like me to help categorize?`;
  }
  
  // Quarterly taxes
  if (q.includes('quarterly') || q.includes('estimated tax')) {
    return `📅 **Quarterly Estimated Taxes**

**Due Dates:**
• Q1: April 15
• Q2: June 15  
• Q3: September 15
• Q4: January 15 (next year)

**Who Needs to Pay:**
Self-employed people who expect to owe $1,000+ in taxes

**How to Calculate:**
1. Estimate your annual income
2. Subtract deductions
3. Calculate tax (use last year's rate)
4. Divide by 4

**Safe Harbor Rule:**
Pay at least 100% of last year's tax (110% if income >$150k) to avoid penalties.

**How to Pay:**
• IRS Direct Pay (free)
• EFTPS.gov
• IRS2Go app

**Pro Tip:** Set aside 25-30% of every payment you receive in a separate savings account for taxes!`;
  }
  
  // W-9 / 1099
  if (q.includes('w-9') || q.includes('w9') || q.includes('1099')) {
    return `📄 **W-9 vs 1099 Explained**

**W-9 (Request for Taxpayer ID)**
• You fill this out
• Give to clients who will pay you $600+
• Contains your name, address, SSN or EIN
• Tip: Keep a PDF ready to send!

**1099-NEC (Nonemployee Compensation)**
• Clients send this TO you (and IRS)
• Shows total they paid you that year
• You should receive by January 31
• Report this income on Schedule C

**Common Questions:**

Q: Do I need an EIN?
A: Sole proprietors can use SSN, but EIN is safer (protects your SSN)

Q: What if I don't get a 1099?
A: Report the income anyway! IRS knows.

Q: Client asking for W-9, is this legit?
A: Yes, it's standard. They need it for their taxes.

Would you like me to help you understand any other tax forms?`;
  }
  
  // Business structure
  if (q.includes('llc') || q.includes('corporation') || q.includes('sole proprietor') || q.includes('business structure')) {
    return `🏢 **Business Structure Guide**

**Sole Proprietorship**
• Simplest, no paperwork to start
• You ARE the business
• Personal liability (risky)
• Self-employment tax: 15.3%

**LLC (Most Popular)**
• Separates you from business
• Liability protection
• Can choose how to be taxed
• ~$50-500 to form depending on state

**S-Corp**
• Can reduce self-employment tax
• More paperwork (payroll required)
• Best when profit > $60-80k
• You pay yourself a "reasonable salary"

**When to Switch from Sole Prop to LLC:**
• When you have assets to protect
• When you're signing contracts
• When you have significant income
• When you want to look more professional

**Pro Tip:** An LLC taxed as S-Corp is often the sweet spot for profitable small businesses!

Would you like help understanding which structure might be best for your business?`;
  }
  
  // Catch-all helpful response
  return `That's a great question! Here's what I can help with:

**Tax Topics:**
• Deductions (home office, meals, vehicle, etc.)
• Quarterly estimated taxes
• W-9 and 1099 forms
• Business structures

**Bookkeeping:**
• Expense categorization
• Record-keeping best practices
• Tax preparation tips

**Business:**
• Invoicing basics
• Contract essentials
• Getting paid

Try asking me something like:
• "Is my phone bill tax deductible?"
• "When are quarterly taxes due?"
• "What's the difference between W-9 and 1099?"
• "How do I calculate home office deduction?"

I'm here to help! 💼`;
}
