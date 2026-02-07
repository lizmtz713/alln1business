# 🏢 Alln1 Business

**All your business, in one place.**

An all-in-one business management app for entrepreneurs, freelancers, and small business owners. Track bills, scan receipts, store documents, and get AI-powered answers to tax and bookkeeping questions — all from your phone.

---

## ✨ Features

### 📁 Document Vault
- **Secure storage** for W-9s, insurance certs, business licenses
- **Easy sharing** — one tap to send docs to clients or vendors
- **Organized by type** — tax forms, contracts, insurance, SOS status
- **Digital business card** — share your info professionally

### 💸 Bills Tracker
- **Track recurring bills** — utilities, rent, subscriptions, services
- **Due date reminders** — never miss a payment
- **Monthly overview** — see total expenses at a glance
- **Account details** — store company name, phone, account numbers

### 🧾 Receipt Scanner
- **Snap & save** — photograph receipts instantly
- **Auto-categorize** — AI suggests expense categories
- **Tax deductible tagging** — flag deductible expenses
- **Export for taxes** — organized records for tax time

### 🤖 AI Business Assistant
Trained on real tax knowledge — ask anything:
- "Is my home office tax deductible?"
- "What's the difference between W-9 and 1099?"
- "When are quarterly taxes due?"
- "How do I deduct business meals?"
- "Should I form an LLC?"

### 📊 Tax Readiness Score
Know exactly where you stand before tax season:
- Track your progress from 0% to 100%
- Get personalized recommendations
- See your total potential deductions
- Never scramble at tax time again

### ⚡ Quick Add
Natural language expense entry:
- Type "Spent $47 at Staples on ink"
- AI extracts amount, vendor, and category
- One-tap save — no forms to fill out

### 📄 Invoices & Templates (Coming Soon)
- Professional invoice templates
- Purchase order creation
- Send invoices directly to clients

### 🔗 Integrations (Coming Soon)
- QuickBooks sync
- Bank feed imports
- Export to accountant

---

## 🎯 Who It's For

- **Freelancers** — track income and expenses without the complexity
- **Solopreneurs** — all your business docs in one secure place
- **Small business owners** — stay organized for tax time
- **Side hustlers** — simple expense tracking from day one

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo) + TypeScript
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Intent-based assistant (upgradeable to GPT)
- **OCR:** Receipt scanning (planned)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Firebase project

### Installation

```bash
cd app
npm install
npx expo start
```

### Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Copy config to `app/src/config/firebase.ts`

### Firestore Rules (Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /documents/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /bills/{billId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /receipts/{receiptId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Dashboard | Overview with quick actions and stats |
| Documents | Business document vault by category |
| Bills | Recurring bill tracker with due dates |
| Receipts | Expense receipts with categories |
| AI Chat | Ask business, tax, and legal questions |
| Profile | Settings and business info |

---

## 📋 Roadmap

- [x] Core app structure
- [x] Authentication
- [x] Documents vault
- [x] Bills tracker
- [x] Receipts manager
- [x] AI assistant with real tax knowledge
- [x] Natural language expense entry ("$47 at Staples")
- [x] Smart receipt categorization
- [x] Tax readiness score
- [x] Dashboard insights & alerts
- [x] Onboarding flow
- [ ] Real OCR integration (Google Vision)
- [ ] Push notifications for due dates
- [ ] Invoice templates
- [ ] QuickBooks integration
- [ ] Bank feed imports
- [ ] Accountant export/sharing
- [ ] Voice input

---

## 📄 License

MIT

---

*Built for entrepreneurs who want simplicity, not complexity.*
