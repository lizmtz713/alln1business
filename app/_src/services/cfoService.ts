// AI CFO Service - Your Proactive Financial Partner
// This is what makes Alln1 world-changing

import { Receipt, Bill, BusinessProfile } from '../types';

// ===========================================
// BUSINESS HEALTH SCORE
// ===========================================

export interface BusinessHealthScore {
  overall: number; // 0-100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  components: {
    profitability: { score: number; trend: 'up' | 'down' | 'stable'; details: string };
    cashFlow: { score: number; runwayMonths: number; details: string };
    taxReadiness: { score: number; estimatedOwed: number; details: string };
    organization: { score: number; details: string };
    growth: { score: number; yoyChange: number; details: string };
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  opportunities: string[];
}

export function calculateBusinessHealth(
  monthlyRevenue: number,
  monthlyExpenses: number,
  cashOnHand: number,
  receiptsCount: number,
  documentsCount: number,
  previousYearRevenue: number,
  taxesPaidThisYear: number,
  estimatedTaxLiability: number
): BusinessHealthScore {
  
  // Profitability (25 points)
  const profitMargin = monthlyRevenue > 0 
    ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 
    : 0;
  let profitScore = 0;
  let profitTrend: 'up' | 'down' | 'stable' = 'stable';
  
  if (profitMargin >= 30) profitScore = 25;
  else if (profitMargin >= 20) profitScore = 22;
  else if (profitMargin >= 15) profitScore = 18;
  else if (profitMargin >= 10) profitScore = 14;
  else if (profitMargin >= 5) profitScore = 10;
  else if (profitMargin >= 0) profitScore = 5;
  else profitScore = 0;

  // Cash Flow (25 points)
  const monthlyBurn = monthlyExpenses - monthlyRevenue;
  const runwayMonths = monthlyBurn > 0 
    ? Math.max(0, cashOnHand / monthlyBurn)
    : 999; // Profitable = infinite runway
  
  let cashScore = 0;
  if (runwayMonths >= 12 || monthlyBurn <= 0) cashScore = 25;
  else if (runwayMonths >= 6) cashScore = 20;
  else if (runwayMonths >= 3) cashScore = 12;
  else if (runwayMonths >= 1) cashScore = 5;
  else cashScore = 0;

  // Tax Readiness (20 points)
  const taxPrepared = estimatedTaxLiability > 0 
    ? (taxesPaidThisYear / estimatedTaxLiability) * 100
    : 100;
  let taxScore = Math.min(20, Math.round(taxPrepared / 5));

  // Organization (15 points)
  let orgScore = 0;
  if (receiptsCount >= 100) orgScore += 8;
  else if (receiptsCount >= 50) orgScore += 6;
  else if (receiptsCount >= 20) orgScore += 4;
  else orgScore += receiptsCount * 0.2;
  
  if (documentsCount >= 10) orgScore += 7;
  else if (documentsCount >= 5) orgScore += 5;
  else orgScore += documentsCount;
  
  orgScore = Math.min(15, orgScore);

  // Growth (15 points)
  const yoyChange = previousYearRevenue > 0 
    ? ((monthlyRevenue * 12 - previousYearRevenue) / previousYearRevenue) * 100
    : 0;
  
  let growthScore = 0;
  if (yoyChange >= 50) growthScore = 15;
  else if (yoyChange >= 25) growthScore = 12;
  else if (yoyChange >= 10) growthScore = 9;
  else if (yoyChange >= 0) growthScore = 6;
  else if (yoyChange >= -10) growthScore = 3;
  else growthScore = 0;

  // Calculate overall
  const overall = profitScore + cashScore + taxScore + orgScore + growthScore;
  
  // Grade
  let grade: BusinessHealthScore['grade'];
  if (overall >= 95) grade = 'A+';
  else if (overall >= 90) grade = 'A';
  else if (overall >= 85) grade = 'A-';
  else if (overall >= 80) grade = 'B+';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 70) grade = 'B-';
  else if (overall >= 65) grade = 'C+';
  else if (overall >= 60) grade = 'C';
  else if (overall >= 55) grade = 'C-';
  else if (overall >= 50) grade = 'D';
  else grade = 'F';

  // Risk assessment
  const riskFactors: string[] = [];
  let riskLevel: BusinessHealthScore['riskLevel'] = 'low';
  
  if (runwayMonths < 2 && monthlyBurn > 0) {
    riskFactors.push('Critical: Less than 2 months of cash runway');
    riskLevel = 'critical';
  } else if (runwayMonths < 4 && monthlyBurn > 0) {
    riskFactors.push('Low cash reserves — consider reducing expenses');
    riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
  }
  
  if (profitMargin < 0) {
    riskFactors.push('Operating at a loss — expenses exceed revenue');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }
  
  if (taxPrepared < 50) {
    riskFactors.push('Tax savings behind schedule — potential penalty risk');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  // Opportunities
  const opportunities: string[] = [];
  
  if (profitMargin >= 20 && cashOnHand > monthlyExpenses * 6) {
    opportunities.push('Strong position — consider investing in growth');
  }
  if (receiptsCount < 20) {
    opportunities.push('Log more receipts to maximize deductions');
  }
  if (!documentsCount) {
    opportunities.push('Upload your W-9 and insurance for quick sharing');
  }
  if (yoyChange > 25) {
    opportunities.push('Great growth! Consider hiring or expanding');
  }
  if (estimatedTaxLiability > 5000) {
    opportunities.push('High tax liability — explore retirement account contributions');
  }

  return {
    overall,
    grade,
    components: {
      profitability: {
        score: profitScore,
        trend: profitTrend,
        details: `${profitMargin.toFixed(1)}% profit margin`
      },
      cashFlow: {
        score: cashScore,
        runwayMonths: Math.round(runwayMonths),
        details: runwayMonths > 100 
          ? 'Profitable — positive cash flow' 
          : `${Math.round(runwayMonths)} months runway`
      },
      taxReadiness: {
        score: taxScore,
        estimatedOwed: estimatedTaxLiability - taxesPaidThisYear,
        details: `${taxPrepared.toFixed(0)}% of estimated taxes saved`
      },
      organization: {
        score: orgScore,
        details: `${receiptsCount} receipts, ${documentsCount} documents`
      },
      growth: {
        score: growthScore,
        yoyChange: Math.round(yoyChange),
        details: yoyChange >= 0 ? `+${Math.round(yoyChange)}% YoY` : `${Math.round(yoyChange)}% YoY`
      }
    },
    riskLevel,
    riskFactors,
    opportunities
  };
}

// ===========================================
// PROACTIVE CFO INSIGHTS
// ===========================================

export interface CFOInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'celebration' | 'action' | 'tip';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: {
    label: string;
    screen?: string;
    data?: any;
  };
  dismissable: boolean;
  emoji: string;
}

export function generateCFOInsights(
  health: BusinessHealthScore,
  monthlyRevenue: number,
  monthlyExpenses: number,
  cashOnHand: number,
  totalDeductions: number,
  receiptsThisMonth: number,
  dayOfMonth: number,
  quarterEndingSoon: boolean
): CFOInsight[] {
  const insights: CFOInsight[] = [];
  const id = () => Math.random().toString(36).substr(2, 9);

  // CRITICAL ALERTS
  if (health.riskLevel === 'critical') {
    insights.push({
      id: id(),
      type: 'alert',
      priority: 'high',
      title: 'Cash Flow Alert',
      message: `You have less than ${health.components.cashFlow.runwayMonths} months of runway. Let's look at options.`,
      action: { label: 'See Options', screen: 'CashFlowHelp' },
      dismissable: false,
      emoji: '🚨'
    });
  }

  // QUARTERLY TAX REMINDER
  if (quarterEndingSoon && health.components.taxReadiness.estimatedOwed > 500) {
    insights.push({
      id: id(),
      type: 'action',
      priority: 'high',
      title: 'Quarterly Taxes Due Soon',
      message: `You owe approximately $${health.components.taxReadiness.estimatedOwed.toLocaleString()} in estimated taxes. Payment is due in ${15 - dayOfMonth + (dayOfMonth > 15 ? 30 : 0)} days.`,
      action: { label: 'How to Pay', screen: 'TaxPayment' },
      dismissable: true,
      emoji: '📅'
    });
  }

  // CELEBRATION: Profitable month
  if (monthlyRevenue > monthlyExpenses && monthlyRevenue > 5000) {
    const profit = monthlyRevenue - monthlyExpenses;
    insights.push({
      id: id(),
      type: 'celebration',
      priority: 'medium',
      title: 'Profitable Month! 🎉',
      message: `You made $${profit.toLocaleString()} in profit this month. You're in the top 30% of small businesses.`,
      dismissable: true,
      emoji: '🎊'
    });
  }

  // OPPORTUNITY: High deductions
  if (totalDeductions > 10000) {
    insights.push({
      id: id(),
      type: 'opportunity',
      priority: 'medium',
      title: 'Tax Savings Unlocked',
      message: `You've tracked $${totalDeductions.toLocaleString()} in deductions. That could save you $${Math.round(totalDeductions * 0.25).toLocaleString()} in taxes!`,
      dismissable: true,
      emoji: '💰'
    });
  }

  // TIP: Low receipt logging
  if (receiptsThisMonth < 5 && dayOfMonth > 15) {
    insights.push({
      id: id(),
      type: 'tip',
      priority: 'low',
      title: 'Missing Receipts?',
      message: `Only ${receiptsThisMonth} receipts logged this month. Don't lose deductions — snap them now!`,
      action: { label: 'Add Receipt', screen: 'AddReceipt' },
      dismissable: true,
      emoji: '📸'
    });
  }

  // OPPORTUNITY: Excess cash
  if (cashOnHand > monthlyExpenses * 6 && health.components.profitability.score >= 15) {
    insights.push({
      id: id(),
      type: 'opportunity',
      priority: 'low',
      title: 'Excess Cash Opportunity',
      message: `You have ${Math.round(cashOnHand / monthlyExpenses)} months of expenses saved. Consider a high-yield savings account or investing in growth.`,
      dismissable: true,
      emoji: '📈'
    });
  }

  // MILESTONE: Organization
  if (health.components.organization.score >= 14) {
    insights.push({
      id: id(),
      type: 'celebration',
      priority: 'low',
      title: 'Organization Master',
      message: 'Your records are impeccable. If the IRS came knocking, you\'d be ready. 💪',
      dismissable: true,
      emoji: '🏆'
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

// ===========================================
// CASH FLOW FORECASTING
// ===========================================

export interface CashFlowForecast {
  current: number;
  projections: { month: string; amount: number; status: 'safe' | 'warning' | 'danger' }[];
  lowestPoint: { month: string; amount: number };
  recommendation: string;
}

export function forecastCashFlow(
  currentCash: number,
  averageMonthlyRevenue: number,
  averageMonthlyExpenses: number,
  upcomingBills: { amount: number; dueDate: Date }[],
  months: number = 6
): CashFlowForecast {
  const projections: CashFlowForecast['projections'] = [];
  let runningCash = currentCash;
  let lowestAmount = currentCash;
  let lowestMonth = 'Now';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = monthNames[futureDate.getMonth()];
    
    // Add revenue, subtract expenses
    runningCash += averageMonthlyRevenue - averageMonthlyExpenses;
    
    // Subtract any known upcoming bills
    upcomingBills.forEach(bill => {
      const billMonth = bill.dueDate.getMonth();
      if (billMonth === futureDate.getMonth()) {
        runningCash -= bill.amount;
      }
    });
    
    const status = runningCash >= averageMonthlyExpenses * 3 
      ? 'safe' 
      : runningCash >= averageMonthlyExpenses 
        ? 'warning' 
        : 'danger';
    
    projections.push({
      month: monthName,
      amount: Math.round(runningCash),
      status
    });
    
    if (runningCash < lowestAmount) {
      lowestAmount = runningCash;
      lowestMonth = monthName;
    }
  }

  // Generate recommendation
  let recommendation = '';
  if (lowestAmount < 0) {
    recommendation = `⚠️ You may run out of cash in ${lowestMonth}. Consider reducing expenses or increasing revenue before then.`;
  } else if (lowestAmount < averageMonthlyExpenses) {
    recommendation = `Cash will get tight in ${lowestMonth}. Consider building a buffer of at least $${(averageMonthlyExpenses * 2).toLocaleString()}.`;
  } else if (lowestAmount > averageMonthlyExpenses * 6) {
    recommendation = `Strong cash position! Your money could be working harder in a high-yield savings account.`;
  } else {
    recommendation = `Cash flow looks healthy. Keep maintaining 3-6 months of expenses as a buffer.`;
  }

  return {
    current: currentCash,
    projections,
    lowestPoint: { month: lowestMonth, amount: Math.round(lowestAmount) },
    recommendation
  };
}

// ===========================================
// BENCHMARK COMPARISONS
// ===========================================

export interface Benchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  percentile: number;
  status: 'above' | 'average' | 'below';
  insight: string;
}

// Industry averages (would come from real data in production)
const INDUSTRY_BENCHMARKS = {
  consulting: {
    profitMargin: 35,
    marketingSpend: 8,
    softwareSpend: 5,
    taxRate: 25,
  },
  ecommerce: {
    profitMargin: 15,
    marketingSpend: 20,
    softwareSpend: 8,
    taxRate: 22,
  },
  freelance: {
    profitMargin: 45,
    marketingSpend: 5,
    softwareSpend: 3,
    taxRate: 28,
  },
  default: {
    profitMargin: 20,
    marketingSpend: 10,
    softwareSpend: 5,
    taxRate: 25,
  }
};

export function getBenchmarks(
  industry: string,
  profitMargin: number,
  marketingSpend: number,
  softwareSpend: number
): Benchmark[] {
  const benchmarks = INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS] 
    || INDUSTRY_BENCHMARKS.default;
  
  const results: Benchmark[] = [];
  
  // Profit Margin
  const profitPercentile = Math.min(99, Math.max(1, 50 + (profitMargin - benchmarks.profitMargin) * 2));
  results.push({
    metric: 'Profit Margin',
    yourValue: profitMargin,
    industryAverage: benchmarks.profitMargin,
    percentile: Math.round(profitPercentile),
    status: profitMargin >= benchmarks.profitMargin * 1.1 ? 'above' 
      : profitMargin >= benchmarks.profitMargin * 0.9 ? 'average' 
      : 'below',
    insight: profitMargin >= benchmarks.profitMargin 
      ? `You're outperforming ${Math.round(profitPercentile)}% of ${industry || 'similar'} businesses!`
      : `Most ${industry || 'similar'} businesses have ${benchmarks.profitMargin}% margins. Room to improve!`
  });
  
  // Marketing Spend
  const marketingPercentile = 50 + (benchmarks.marketingSpend - marketingSpend) * 3;
  results.push({
    metric: 'Marketing Spend',
    yourValue: marketingSpend,
    industryAverage: benchmarks.marketingSpend,
    percentile: Math.round(Math.min(99, Math.max(1, marketingPercentile))),
    status: Math.abs(marketingSpend - benchmarks.marketingSpend) <= 3 ? 'average'
      : marketingSpend < benchmarks.marketingSpend ? 'below' : 'above',
    insight: marketingSpend < benchmarks.marketingSpend - 3
      ? `You're spending less on marketing than most. Consider investing more to grow.`
      : marketingSpend > benchmarks.marketingSpend + 5
        ? `High marketing spend. Make sure you're tracking ROI.`
        : `Marketing spend is in line with industry norms.`
  });

  return results;
}

// ===========================================
// SMART MONEY MOVES
// ===========================================

export interface MoneyMove {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeRequired: string;
  action: string;
}

export function suggestMoneyMoves(
  annualRevenue: number,
  annualExpenses: number,
  hasRetirementAccount: boolean,
  hasHealthInsurance: boolean,
  homeOfficeDeduction: boolean,
  vehicleDeduction: boolean
): MoneyMove[] {
  const moves: MoneyMove[] = [];
  const profit = annualRevenue - annualExpenses;
  
  // SEP-IRA contribution
  if (!hasRetirementAccount && profit > 20000) {
    const maxContribution = Math.min(profit * 0.25, 66000);
    moves.push({
      id: 'sep-ira',
      title: 'Open a SEP-IRA',
      description: `Contribute up to $${maxContribution.toLocaleString()} tax-free to retirement.`,
      potentialSavings: Math.round(maxContribution * 0.25),
      difficulty: 'medium',
      timeRequired: '1 hour',
      action: 'Learn More'
    });
  }
  
  // Home office deduction
  if (!homeOfficeDeduction) {
    moves.push({
      id: 'home-office',
      title: 'Claim Home Office Deduction',
      description: 'Deduct $5/sq ft up to 300 sq ft, or actual expenses.',
      potentialSavings: 1500,
      difficulty: 'easy',
      timeRequired: '15 minutes',
      action: 'Calculate'
    });
  }
  
  // Health insurance deduction
  if (!hasHealthInsurance && profit > 50000) {
    moves.push({
      id: 'health-insurance',
      title: 'Self-Employed Health Insurance Deduction',
      description: 'Deduct 100% of health insurance premiums.',
      potentialSavings: Math.round(6000 * 0.25),
      difficulty: 'easy',
      timeRequired: '10 minutes',
      action: 'Learn More'
    });
  }
  
  // Vehicle deduction
  if (!vehicleDeduction && annualRevenue > 30000) {
    moves.push({
      id: 'vehicle',
      title: 'Track Vehicle Mileage',
      description: '67¢ per business mile. 10,000 miles = $6,700 deduction.',
      potentialSavings: Math.round(6700 * 0.25),
      difficulty: 'easy',
      timeRequired: 'Ongoing',
      action: 'Start Tracking'
    });
  }
  
  // S-Corp election
  if (profit > 80000 && !hasRetirementAccount) {
    moves.push({
      id: 's-corp',
      title: 'Consider S-Corp Election',
      description: 'Could save $5,000+ in self-employment taxes annually.',
      potentialSavings: Math.round(profit * 0.075),
      difficulty: 'hard',
      timeRequired: '2-4 weeks',
      action: 'Learn More'
    });
  }

  return moves.sort((a, b) => b.potentialSavings - a.potentialSavings);
}
