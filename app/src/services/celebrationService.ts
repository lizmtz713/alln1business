// Celebration Service - Make Entrepreneurship Feel Good
// Because running a business should have wins, not just stress

export interface Milestone {
  id: string;
  type: 'revenue' | 'savings' | 'organization' | 'streak' | 'growth' | 'special';
  title: string;
  description: string;
  emoji: string;
  achieved: boolean;
  achievedDate?: Date;
  progress?: number; // 0-100
  requirement?: number;
  currentValue?: number;
}

export interface Celebration {
  id: string;
  title: string;
  message: string;
  emoji: string;
  confetti: boolean;
  shareMessage?: string;
}

// ===========================================
// MILESTONE DEFINITIONS
// ===========================================

export const MILESTONES: Omit<Milestone, 'achieved' | 'achievedDate' | 'progress' | 'currentValue'>[] = [
  // Revenue Milestones
  {
    id: 'first-dollar',
    type: 'revenue',
    title: 'First Dollar',
    description: 'Log your first revenue',
    emoji: '💵',
    requirement: 1,
  },
  {
    id: 'revenue-1k',
    type: 'revenue',
    title: '$1,000 Club',
    description: 'Earn $1,000 in revenue',
    emoji: '💰',
    requirement: 1000,
  },
  {
    id: 'revenue-10k',
    type: 'revenue',
    title: 'Five Figures',
    description: 'Earn $10,000 in revenue',
    emoji: '🎯',
    requirement: 10000,
  },
  {
    id: 'revenue-50k',
    type: 'revenue',
    title: 'Halfway to Six Figures',
    description: 'Earn $50,000 in revenue',
    emoji: '🚀',
    requirement: 50000,
  },
  {
    id: 'revenue-100k',
    type: 'revenue',
    title: 'Six Figure Business',
    description: 'Earn $100,000 in revenue',
    emoji: '💎',
    requirement: 100000,
  },
  {
    id: 'revenue-250k',
    type: 'revenue',
    title: 'Quarter Million',
    description: 'Earn $250,000 in revenue',
    emoji: '👑',
    requirement: 250000,
  },
  
  // Savings/Deductions Milestones
  {
    id: 'first-deduction',
    type: 'savings',
    title: 'Tax Saver',
    description: 'Log your first deductible expense',
    emoji: '🧾',
    requirement: 1,
  },
  {
    id: 'deductions-1k',
    type: 'savings',
    title: 'Smart Saver',
    description: 'Track $1,000 in deductions',
    emoji: '🏦',
    requirement: 1000,
  },
  {
    id: 'deductions-5k',
    type: 'savings',
    title: 'Deduction Hunter',
    description: 'Track $5,000 in deductions',
    emoji: '🎯',
    requirement: 5000,
  },
  {
    id: 'deductions-10k',
    type: 'savings',
    title: 'Tax Ninja',
    description: 'Track $10,000 in deductions',
    emoji: '🥷',
    requirement: 10000,
  },
  
  // Organization Milestones
  {
    id: 'first-receipt',
    type: 'organization',
    title: 'First Receipt',
    description: 'Log your first receipt',
    emoji: '📸',
    requirement: 1,
  },
  {
    id: 'receipts-25',
    type: 'organization',
    title: 'Getting Organized',
    description: 'Log 25 receipts',
    emoji: '📁',
    requirement: 25,
  },
  {
    id: 'receipts-100',
    type: 'organization',
    title: 'Organization Pro',
    description: 'Log 100 receipts',
    emoji: '🏆',
    requirement: 100,
  },
  {
    id: 'receipts-500',
    type: 'organization',
    title: 'Master Organizer',
    description: 'Log 500 receipts',
    emoji: '🌟',
    requirement: 500,
  },
  {
    id: 'first-document',
    type: 'organization',
    title: 'Document Vault',
    description: 'Upload your first document',
    emoji: '📄',
    requirement: 1,
  },
  {
    id: 'tax-ready',
    type: 'organization',
    title: 'Tax Ready',
    description: 'Reach 80% tax readiness score',
    emoji: '✅',
    requirement: 80,
  },
  
  // Streak Milestones
  {
    id: 'streak-7',
    type: 'streak',
    title: 'Week Warrior',
    description: 'Log expenses 7 days in a row',
    emoji: '🔥',
    requirement: 7,
  },
  {
    id: 'streak-30',
    type: 'streak',
    title: 'Monthly Master',
    description: 'Log expenses 30 days in a row',
    emoji: '💪',
    requirement: 30,
  },
  {
    id: 'streak-90',
    type: 'streak',
    title: 'Quarterly Champion',
    description: 'Log expenses 90 days in a row',
    emoji: '🏅',
    requirement: 90,
  },
  
  // Growth Milestones
  {
    id: 'profitable-month',
    type: 'growth',
    title: 'In The Black',
    description: 'Have a profitable month',
    emoji: '📈',
    requirement: 1,
  },
  {
    id: 'profitable-quarter',
    type: 'growth',
    title: 'Consistent Profit',
    description: 'Be profitable 3 months in a row',
    emoji: '📊',
    requirement: 3,
  },
  {
    id: 'growth-25',
    type: 'growth',
    title: 'Growth Mode',
    description: 'Grow revenue 25% year over year',
    emoji: '🌱',
    requirement: 25,
  },
  {
    id: 'growth-50',
    type: 'growth',
    title: 'Rapid Growth',
    description: 'Grow revenue 50% year over year',
    emoji: '🚀',
    requirement: 50,
  },
  {
    id: 'growth-100',
    type: 'growth',
    title: 'Hypergrowth',
    description: 'Double your revenue year over year',
    emoji: '🔥',
    requirement: 100,
  },
  
  // Special Milestones
  {
    id: 'first-year',
    type: 'special',
    title: 'One Year Anniversary',
    description: 'Use Alln1 for a full year',
    emoji: '🎂',
    requirement: 365,
  },
  {
    id: 'health-score-a',
    type: 'special',
    title: 'A Student',
    description: 'Achieve an A grade business health score',
    emoji: '🅰️',
    requirement: 90,
  },
  {
    id: 'runway-6mo',
    type: 'special',
    title: 'Safety Net',
    description: 'Build 6 months of cash runway',
    emoji: '🛡️',
    requirement: 6,
  },
];

// ===========================================
// CELEBRATION TRIGGERS
// ===========================================

export function checkMilestones(
  totalRevenue: number,
  totalDeductions: number,
  receiptsCount: number,
  documentsCount: number,
  streakDays: number,
  profitableMonths: number,
  yoyGrowth: number,
  healthScore: number,
  runwayMonths: number,
  daysUsing: number,
  previouslyAchieved: string[]
): Milestone[] {
  const achieved: Milestone[] = [];
  
  const values: Record<string, number> = {
    'first-dollar': totalRevenue,
    'revenue-1k': totalRevenue,
    'revenue-10k': totalRevenue,
    'revenue-50k': totalRevenue,
    'revenue-100k': totalRevenue,
    'revenue-250k': totalRevenue,
    'first-deduction': totalDeductions > 0 ? 1 : 0,
    'deductions-1k': totalDeductions,
    'deductions-5k': totalDeductions,
    'deductions-10k': totalDeductions,
    'first-receipt': receiptsCount,
    'receipts-25': receiptsCount,
    'receipts-100': receiptsCount,
    'receipts-500': receiptsCount,
    'first-document': documentsCount,
    'tax-ready': healthScore, // Using health score as proxy
    'streak-7': streakDays,
    'streak-30': streakDays,
    'streak-90': streakDays,
    'profitable-month': profitableMonths,
    'profitable-quarter': profitableMonths,
    'growth-25': yoyGrowth,
    'growth-50': yoyGrowth,
    'growth-100': yoyGrowth,
    'first-year': daysUsing,
    'health-score-a': healthScore,
    'runway-6mo': runwayMonths,
  };
  
  for (const milestone of MILESTONES) {
    const currentValue = values[milestone.id] || 0;
    const isAchieved = currentValue >= (milestone.requirement || 0);
    const wasAlreadyAchieved = previouslyAchieved.includes(milestone.id);
    
    achieved.push({
      ...milestone,
      achieved: isAchieved,
      achievedDate: isAchieved && !wasAlreadyAchieved ? new Date() : undefined,
      progress: Math.min(100, (currentValue / (milestone.requirement || 1)) * 100),
      currentValue,
    });
  }
  
  return achieved;
}

export function getNewlyAchieved(
  milestones: Milestone[],
  previouslyAchieved: string[]
): Milestone[] {
  return milestones.filter(m => m.achieved && !previouslyAchieved.includes(m.id));
}

// ===========================================
// CELEBRATION MESSAGES
// ===========================================

export function generateCelebration(milestone: Milestone): Celebration {
  const celebrations: Record<string, Partial<Celebration>> = {
    'revenue-100k': {
      title: '🎉 SIX FIGURES!',
      message: "You've hit $100,000 in revenue. You're officially running a six-figure business. Only 25% of small businesses ever reach this milestone.",
      confetti: true,
      shareMessage: "Just hit six figures in my business! 💎 #SixFigures #SmallBusiness",
    },
    'tax-ready': {
      title: '✅ Tax Ready!',
      message: "Your tax readiness score is above 80%. When April comes, you'll be laughing while others are panicking.",
      confetti: true,
    },
    'streak-30': {
      title: '🔥 30 Day Streak!',
      message: "You've logged expenses every day for a month. You're building habits that separate successful business owners from the rest.",
      confetti: true,
    },
    'health-score-a': {
      title: '🅰️ A Grade!',
      message: "Your business health score hit the A range. You're in the top 10% of organized small business owners.",
      confetti: true,
    },
    'runway-6mo': {
      title: '🛡️ Safety Net Built!',
      message: "You have 6 months of runway. Most businesses fail because they run out of cash — you won't be one of them.",
      confetti: true,
    },
  };
  
  const custom = celebrations[milestone.id];
  
  return {
    id: milestone.id,
    title: custom?.title || `${milestone.emoji} ${milestone.title}!`,
    message: custom?.message || `You've achieved: ${milestone.description}. Keep crushing it!`,
    emoji: milestone.emoji,
    confetti: custom?.confetti || false,
    shareMessage: custom?.shareMessage,
  };
}

// ===========================================
// ENCOURAGEMENT MESSAGES
// ===========================================

export function getEncouragement(
  healthScore: number,
  streakDays: number,
  daysUsing: number
): string {
  if (healthScore >= 90) {
    return "You're running your business like a pro. Keep it up! 💪";
  }
  if (healthScore >= 70) {
    return "Solid foundation. A few tweaks and you'll be unstoppable.";
  }
  if (streakDays >= 7) {
    return `${streakDays} days in a row! Consistency is the key to success.`;
  }
  if (daysUsing < 7) {
    return "Great start! The first week sets the tone for the whole year.";
  }
  if (daysUsing >= 30) {
    return "One month in! You're officially building better habits.";
  }
  return "Every expense tracked is money saved at tax time. Keep going!";
}

// ===========================================
// COMPARATIVE INSIGHTS
// ===========================================

export function getComparativeInsight(
  metric: string,
  value: number,
  industryAverage: number
): string {
  const percentile = Math.round(50 + ((value - industryAverage) / industryAverage) * 30);
  const capped = Math.max(1, Math.min(99, percentile));
  
  if (capped >= 80) {
    return `Top ${100 - capped}%! You're outperforming most businesses.`;
  }
  if (capped >= 60) {
    return `Above average — better than ${capped}% of similar businesses.`;
  }
  if (capped >= 40) {
    return `Right in the middle — room to improve.`;
  }
  return `Below average, but awareness is the first step to improvement.`;
}
