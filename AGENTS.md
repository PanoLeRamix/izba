# Guidelines for AI Agents (AGENTS.md)

This document contains mandatory guidelines and context for all AI agents working on this project.

## 🛠️ Technical Standards
- **TypeScript Only:** No JavaScript files allowed. Use strict typing and avoid `any`.
- **Expo Router:** Follow file-based navigation conventions in the `app/` directory.
- **NativeWind & Colors:** Use Tailwind classes for layout. For fixed hex/rgba colors, always use `constants/Colors.ts`. Avoid hardcoding hex strings in components.
- **Hooks & Components:** Encapsulate logic in custom hooks. Extract repetitive UI patterns into reusable components in `components/`.
- **i18n Consistency:** Never hardcode strings in UI components. Use `t('key')` from `react-i18next`. Translation files are located in `assets/locales/`.

## 📁 Project Structure
- `app/`: Expo Router screens and layouts.
- `components/`: Reusable UI components.
- `constants/`: Global constants like `Colors.ts`.
- `hooks/`: Custom React hooks.
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
- **Application:** Use `npm run supabase:push` to apply new migrations to your database environment.
- **RLS:** Always enable and define Row Level Security (RLS) policies for new tables to ensure privacy.
- **SQL-First:** Treat the migration files as the source of truth for the database model.

## ✅ Verification & Evolution
- **Iterative Approach:** Only implement the specific step requested by the user. Do not over-engineer.
- **Proactive Refactoring:** Propose refactors even if out of scope if they benefit long-term maintenance.
- **Document Paradigm Changes:** When introducing a major architectural shift (e.g., centralized colors, new component patterns), you MUST update this `AGENTS.md` file to reflect the new "source of truth".
- **Validation:** Run `npx tsc` to ensure no type errors are introduced.
