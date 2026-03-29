# Izba 🏠

**Izba** (meaning "small room" or "hut" in Slavic languages) is a privacy-focused meal planning application designed for shared households. It aims to simplify the coordination of daily meals without the need for traditional user accounts or invasive data tracking.

## 🚀 Features

- **No-Account Auth:** Join your household using a simple unique code.
- **Collaborative Planning:** Track who's eating, who's cooking, and how many guests are joining.
- **Privacy First:** Data is isolated at the household level.
- **Internationalization:** Full support for French (primary) and English.
- **Optimized UI:** Designed for a seamless mobile experience using Expo and NativeWind.

## 🛠️ Tech Stack

- **Frontend:** [Expo](https://expo.dev/) (React Native) with [Expo Router](https://docs.expo.dev/router/introduction/).
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native).
- **Backend:** [Supabase](https://supabase.com/) for PostgreSQL database and real-time features.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for local state and [TanStack Query](https://tanstack.com/query/latest) for server state.
- **I18n:** [i18next](https://www.i18next.com/) for localization.

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo Go app on your mobile device (or an emulator)
- Supabase CLI (optional, for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd izba
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file (if not already present) with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

## 🗄️ Database Setup

If you want to manage the database schema locally:

1. Link to your Supabase project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. Push migrations:
   ```bash
   npm run supabase:push
   ```

## 📄 License

This project is private and for personal use.
