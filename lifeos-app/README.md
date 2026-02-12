# Life OS - The Ultimate Household App

One app to manage your ENTIRE life - so simple a child could use it, so powerful it replaces 50+ apps.

## Vision

You shouldn't have to THINK about managing your life. AI should handle it. You just live.

## Features

- 💳 **Bills & Subscriptions** - Track all bills, due dates, auto-reminders
- 🛡️ **Insurance** - All policies in one place
- 🚗 **Vehicles** - Maintenance schedules, registration, mileage
- 👨‍👩‍👧‍👦 **Family** - Member profiles, sizes, schedules
- 🏥 **Medical** - Doctors, medications, appointments
- 🐕 **Pets** - Vet records, grooming, food
- 🏠 **Home** - Maintenance, inventory, service providers
- 📄 **Documents** - Secure vault for important docs
- 🔍 **Universal Search** - Find anything instantly
- 🤖 **AI Assistant** - Voice commands, predictive insights

## Tech Stack

- React Native (Expo SDK 52)
- TypeScript
- Expo Router
- Supabase (Auth + Database)
- NativeWind (Tailwind CSS)
- React Query

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Supabase keys:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. Run the app:
   ```bash
   npx expo start
   ```

## Project Structure

```
lifeos-app/
├── app/                 # Expo Router pages
│   ├── (auth)/         # Auth screens
│   ├── (tabs)/         # Main app tabs
│   └── (modals)/       # Modal screens
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Constants, utils
│   ├── providers/      # Context providers
│   └── services/       # API services
└── assets/             # Images, fonts
```

## Created By

Elizabeth Martinez - February 2026
