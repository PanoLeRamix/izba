# Guidelines for AI Agents

This document contains mandatory project guidance for all AI agents working in this repository.

## Technical Standards
- TypeScript only. Do not add JavaScript files.
- Keep strict typing. Avoid `any`, `@ts-ignore`, and ad hoc type escapes unless there is no safer option.
- Validate with `npm run typecheck`. The script is now the cross-platform source of truth for TypeScript validation.
- Follow Expo Router file-based navigation in `app/`.
- Use Tailwind classes for layout. For fixed colors, use `constants/Colors.ts`. Do not hardcode new hex colors in components.
- Use `constants/Layout.ts` for reusable spacing, radii, and layout constants.
- Use `useSafeAreaInsets` for top and bottom padding. Do not hardcode notch or home-indicator spacing.
- Prefer custom hooks for non-trivial logic and reusable components for repeated UI patterns.
- Do not hardcode user-facing copy. Add strings to both `assets/locales/en.json` and `assets/locales/fr.json`.

## Security Model
- This app does not use traditional account auth.
- Private access is now mediated through Supabase RPC functions plus bearer session tokens.
- Never reintroduce direct anon table access for `houses`, `users`, `meal_plans`, `house_sessions`, or `user_sessions`.
- Do not add new client code that queries private tables with `supabase.from(...)`. Route private access through service modules and RPC functions instead.
- House onboarding uses a `house_token`. Authenticated in-app actions use a `user_token`.
- Persist session data through `store/authStore.ts` and `utils/storage.ts`. Current storage keys are `house_id`, `house_token`, `user_id`, `user_token`, and `user-language`.
- If you change the security model, update this file and the README in the same change.

## Data Access Rules
- Treat SQL migrations in `supabase/migrations/` as the source of truth.
- Keep RLS enabled on tables, even when access is brokered through security-definer RPCs.
- Apply schema changes via migrations only.
- Prefer extending the existing RPC surface over adding permissive policies.
- Planner mutations should keep optimistic updates in the client.

## Project Structure
- `app/`: Expo Router screens and layouts.
- `components/`: Reusable UI components.
- `constants/`: Global constants such as colors and layout values.
- `hooks/`: Custom React hooks.
- `services/`: Supabase and app service wrappers. Use this layer instead of inline data access in screens.
- `store/`: Zustand state.
- `utils/`: Shared helpers.
- `assets/locales/`: Translation JSON files.
- `supabase/migrations/`: Database migrations.

## Localization
- Primary language: French (`fr`).
- Secondary language: English (`en`).
- Prefer non-gendered language when possible.
- Keep locale files synchronized when adding or changing copy.

## Verification
- Run `npm run typecheck` after code changes.
- If a change affects storage, auth flow, or RPC contracts, review the corresponding screens and services together before finishing.
- If a change alters architecture or workflow for future agents, document it here.
