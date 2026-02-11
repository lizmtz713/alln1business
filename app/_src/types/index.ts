// Alln1 Business Types

export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  createdAt: Date;
}

// Business Documents
export interface BusinessDocument {
  id: string;
  userId: string;
  type: DocumentType;
  name: string;
  fileUrl?: string;
  notes?: string;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 
  | 'w9'
  | 'insurance'
  | 'sos_status'
  | 'tax_exemption'
  | 'business_license'
  | 'contract'
  | 'other';

// Bills
export interface Bill {
  id: string;
  userId: string;
  name: string;
  companyName: string;
  phone?: string;
  accountNumber?: string;
  dueDay: number; // Day of month (1-31)
  amount?: number;
  category: BillCategory;
  isRecurring: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BillCategory =
  | 'utilities'
  | 'rent'
  | 'insurance'
  | 'subscriptions'
  | 'supplies'
  | 'services'
  | 'taxes'
  | 'other';

// Bill Payments
export interface BillPayment {
  id: string;
  billId: string;
  userId: string;
  amount: number;
  paidDate: Date;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
}

// Receipts & Expenses
export interface Receipt {
  id: string;
  userId: string;
  imageUrl: string;
  vendor?: string;
  amount?: number;
  date?: Date;
  category: ExpenseCategory;
  description?: string;
  taxDeductible: boolean;
  ocrProcessed: boolean;
  ocrData?: OCRData;
  createdAt: Date;
}

export interface OCRData {
  rawText: string;
  extractedVendor?: string;
  extractedAmount?: number;
  extractedDate?: string;
  confidence: number;
}

export type ExpenseCategory =
  | 'office_supplies'
  | 'equipment'
  | 'travel'
  | 'meals'
  | 'utilities'
  | 'rent'
  | 'marketing'
  | 'professional_services'
  | 'insurance'
  | 'taxes'
  | 'inventory'
  | 'shipping'
  | 'software'
  | 'other';

// Invoices
export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Business Profile
export interface BusinessProfile {
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ein?: string;
  businessType?: BusinessType;
  website?: string;
  logoUrl?: string;
}

export type BusinessType =
  | 'sole_proprietor'
  | 'llc'
  | 'corporation'
  | 's_corp'
  | 'partnership'
  | 'nonprofit';

// Navigation
export type RootStackParamList = {
  HomeTabs: undefined;
  AddDocument: { type?: DocumentType };
  AddBill: { bill?: Bill };
  AddReceipt: undefined;
  CreateInvoice: { invoice?: Invoice };
  AIChat: undefined;
  DocumentViewer: { document: BusinessDocument };
  BillDetail: { bill: Bill };
  Settings: undefined;
  Login: undefined;
  SignUp: undefined;
  Paywall: { source?: PaywallSource };
};

// ===========================================
// SUBSCRIPTION TYPES
// ===========================================

export type SubscriptionTier = 'free' | 'pro' | 'business';

export type PaywallSource =
  | 'settings'
  | 'receipt_limit'
  | 'ai_limit'
  | 'feature_gate'
  | 'onboarding'
  | 'promotion';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  productIdentifier: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  priceString: string;
  period: 'monthly' | 'yearly';
  features: string[];
}

// Feature flags based on subscription tier
export interface FeatureFlags {
  // Pro+ features
  canUseAICFO: boolean;
  canUseUnlimitedReceipts: boolean;
  canExportData: boolean;
  canUseTaxInsights: boolean;
  
  // Business-only features
  canUseMultiBusiness: boolean;
  canShareWithAccountant: boolean;
  canUseAdvancedReports: boolean;
  canUseTeamCollaboration: boolean;
  canUseAPI: boolean;
}

// Free tier limits
export interface FreeTierLimits {
  receiptsPerMonth: number;
  aiChatsPerDay: number;
}

export const FREE_TIER_LIMITS: FreeTierLimits = {
  receiptsPerMonth: 10,
  aiChatsPerDay: 3,
};

// Usage tracking
export interface UsageStats {
  receiptsThisMonth: number;
  aiChatsToday: number;
  lastReceiptDate: Date | null;
  lastAIChatDate: Date | null;
}
