# Agenda App


A React Native appointment scheduling app built with Expo and Supabase.

## Getting Started

**Quick Start:**
1. Clone/copy the project
2. Install dependencies: `npm install`
3. Create `.env` file with Supabase credentials (see `.env.example` template)
4. Run: `npx expo start`

### Required Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard > Settings > API

---

## Features

- 📅 Calendar view of appointments
- 👥 Client management
- 🔔 SMS reminders (via Supabase Edge Functions)
- 💾 Supabase database integration
- 📱 iOS support

---

## Tech Stack

- **React Native** with **Expo**
- **Supabase** (Database & Backend)
- **React Navigation** (Routing)
-  **Twilio API** (SMS reminders)

---

## Project Structure

```
AgendaTest/
├── screens/          # Screen components
├── context/          # React Context providers
├── components/       # Reusable components
├── lib/             # Utilities (Supabase client, SMS service)
├── supabase/        # Edge Functions (SMS reminders)
└── App.js           # Main app entry point
```

---



//currently no secrets in the database for twilio so will need to add them later
//still trying to get twilio to work and get the number verified and then get the reminder to send
