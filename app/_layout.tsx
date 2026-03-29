import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import '../services/i18n';
import '../global.css';

const queryClient = new QueryClient();

function InitialLayout() {
  const { houseId, userId, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLoggedIn = !!(houseId && userId);

    if (isLoggedIn && inAuthGroup) {
      // Redirect to main app if logged in
      router.replace('/(main)');
    } else if (!isLoggedIn && !inAuthGroup) {
      // Redirect to auth if not logged in
      router.replace('/(auth)');
    }
  }, [houseId, userId, isInitialized, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <InitialLayout />
    </QueryClientProvider>
  );
}
