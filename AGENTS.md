# Guidelines for AI Agents (AGENTS.md)

This document contains mandatory guidelines and context for all AI agents working on this project.

## 🛠️ Technical Standards
- **TypeScript Only:** No JavaScript files allowed. Use strict typing and avoid `any`.
- **Expo Router:** Follow file-based navigation conventions in the `app/` directory.
- **NativeWind:** Use Tailwind classes for styling. Avoid inline `StyleSheet` unless absolutely necessary for complex animations.
- **Hooks-First:** Logic should be encapsulated in custom hooks (e.g., `useMeals`, `useHouseAuth`).
- **i18n Consistency:** Never hardcode strings in UI components. Use `t('key')` from `react-i18next`. Translation files are located in `assets/locales/`.

## 📁 Project Structure
- `app/`: Expo Router screens and layouts.
- `components/`: Reusable UI components (Atomic design preferred).
- `hooks/`: Custom React hooks for logic/data fetching.
- `services/`: API clients (Supabase), storage, and external integrations.
- `store/`: Zustand state definitions.
- `types/`: Global TypeScript definitions.
- `utils/`: Helper functions and constants.
- `assets/locales/`: JSON translation files for i18n.

## 🔐 Privacy & Security (No-Account Auth)
- **No Traditional Auth:** Do not implement email/password or OAuth unless explicitly requested.
- **House-Level Isolation:** Ensure all data operations are scoped to the `house_id`.
- **Secure Storage:** Always use `expo-secure-store` for sensitive local identifiers like `house_id` or `user_id`.

## 🌍 Localization (i18n)
- Primary Language: **French** (`fr`).
- Secondary Language: **English** (`en`).
- When adding a new string, ensure both `fr.json` and `en.json` are updated.

## 🗄️ Database Strategy
- **Migrations:** All database schema changes MUST be recorded as SQL files in `supabase/migrations/`. 
- **RLS:** Always enable and define Row Level Security (RLS) policies for new tables to ensure privacy.
- **SQL-First:** Treat the migration files as the source of truth for the database model.

## ✅ Verification Workflow
- Every feature or bug fix must include corresponding tests in `__tests__` or alongside the file.
- Run `npx tsc` to ensure no type errors are introduced.
- **Iterative Approach:** Only implement the specific step requested by the user. Do not over-engineer or add "future" features.
- **Proactive Refactoring:** While working on files, if you see things that should be refactored or made in a better way, even if this isn't the scope of the task, propose to do it if you think it'd be a good addition to the project.
