# Izba

Izba is a meal planning app for shared households built with Expo, NativeWind, and Supabase.

## What It Does
- Join a house with an invite code.
- Pick or create a household identity.
- Track who is eating, cooking, and bringing guests.
- Use French and English UI copy.

## Stack
- Expo Router for navigation
- React Native + NativeWind for UI
- Zustand for local session state
- TanStack Query for server state
- Supabase Postgres for data and RPCs

## Security Model
- The app does not use email/password accounts.
- Private data access is brokered through Supabase RPC functions.
- Onboarding creates a `house_token`.
- Selecting an identity creates a `user_token`.
- Client code should use the service layer in `services/` instead of direct table queries for private data.

## Local Setup
1. Install dependencies with `npm install`.
2. Create a `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Apply database migrations with `npm run supabase:push`.
4. Start the app with `npm start`.

## Validation
- Run `npm run typecheck`.

## Database Notes
- Schema changes must live in `supabase/migrations/`.
- Do not reopen direct anon access to private tables.
- Extend the RPC layer when adding authenticated features.
