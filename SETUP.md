# Alln1 Business - Setup Guide

## 1. Firebase Setup

### Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add Project" → Name it "alln1-business"
3. Disable Google Analytics (optional)
4. Click "Create Project"

### Enable Authentication
1. In Firebase Console → Build → Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider

### Create Firestore Database
1. Build → Firestore Database
2. Click "Create Database"
3. Start in **test mode** (we'll secure it later)
4. Choose a location close to your users

### Get Config
1. Project Settings (gear icon) → General
2. Scroll to "Your apps" → Click web icon `</>`
3. Register app as "alln1-web"
4. Copy the config object

### Update App Config
Edit `app/src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "alln1-business.firebaseapp.com",
  projectId: "alln1-business",
  storageBucket: "alln1-business.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Firestore Rules (Production)
In Firestore → Rules, paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /documents/{docId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /bills/{billId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /receipts/{receiptId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /invoices/{invoiceId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 2. OpenAI Setup (Optional but Recommended)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API Key
3. Add to your app:

```typescript
// In App.tsx or a startup file
import { setOpenAIKey } from './src/services/openaiService';
setOpenAIKey('sk-your-api-key');
```

Or use environment variables:
```bash
# app/.env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-api-key
```

---

## 3. Run the App

```bash
cd app
npm install
npx expo start
```

Scan QR code with Expo Go app.

---

## 4. Build for App Stores

### iOS
```bash
npx eas build --platform ios
```

### Android
```bash
npx eas build --platform android
```

### Setup EAS (first time)
```bash
npm install -g eas-cli
eas login
eas build:configure
```

---

## 5. Deploy Landing Page

### Vercel (Recommended)
```bash
cd landing
npx vercel
```

### Netlify
```bash
cd landing
npx netlify deploy --prod
```

### Manual
Just upload `landing/index.html` to any static host.

---

## 6. Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| Firebase Config | ✅ Yes | Auth & database |
| OpenAI API Key | ⚡ Recommended | AI features |
| Expo Push Token | Optional | Push notifications |

---

## Questions?
Check the README.md or open an issue on GitHub.
