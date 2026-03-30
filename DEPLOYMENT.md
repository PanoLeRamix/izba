# 🚀 Izba Deployment & Build Guide

This guide covers how to build your Android app and deploy your PWA.

---

## 📱 1. Android Build (EAS)

We use **EAS (Expo Application Services)** to build the Android app. This happens in the cloud, so you don't need a powerful machine.

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Create an Expo account at [expo.dev](https://expo.dev)
3. Log in: `eas login`

### Generate an APK (for testing)
Run this command to get an installable `.apk` file for your phone:

**CRITICAL:** Before building for the first time, you MUST add your Supabase credentials as EAS environment variables so they can be inlined in the APK:
```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value <your-url>
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your-anon-key>
```

Then run the build:
```bash
eas build --platform android --profile preview
```
*Wait for the build to finish, then scan the QR code provided in the terminal to download it.*

### Generate a Play Store Bundle (for release)
```bash
eas build --platform android --profile production
```

---

## 🌐 2. PWA & Web Hosting

### Recommended: Vercel (Free & Fast)
1. Push your code to a **GitHub** repository.
2. Go to [vercel.com](https://vercel.com) and create a free account.
3. Click **"New Project"** and import your GitHub repo.
4. **CRITICAL:** In the Vercel dashboard, go to **Settings > Environment Variables** and add:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Vercel will automatically detect Expo and deploy your site.

### Alternative: Manual Export
If you want to host elsewhere, generate the static files:
```bash
npx expo export --platform web
```
This creates a `dist/` folder that you can upload to any static host (Netlify, GitHub Pages, etc.).

---

## 🎨 3. Assets & Icons

### App Icon
- **Size**: 1024x1024px (Square).
- **Format**: PNG (no transparency for Android main icon).
- **Location**: Replace `./assets/icon.png`.
- **Recommendation**: Use [Lucide.dev](https://lucide.dev) for base shapes or AI generators (DALL-E 3) for unique minimalist cottages.

### Splash Screen
- **Location**: Replace `./assets/splash-icon.png`.
- **Style**: Keep it simple. A small logo in the center of a solid background (`#F9F7F2`).

---

## 🔐 4. Production Checklist

1. [ ] Ensure `EXPO_PUBLIC_SUPABASE_URL` is set in your hosting provider.
2. [ ] Ensure `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set.
3. [ ] Run `npm run typecheck` to ensure no last-minute bugs.
4. [ ] Test the PWA on mobile to ensure the "Install" prompt appears.
