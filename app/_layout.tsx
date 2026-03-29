import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { initI18n } from '../services/i18n';
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
      router.replace('/(main)');
    } else if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [houseId, userId, isInitialized, segments]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-hearth">
        <ActivityIndicator size="large" color="#2D5A27" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initI18n();
      await initialize();
      setAppReady(true);
    };
    setup();
  }, [initialize]);

  if (!appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-hearth">
        <ActivityIndicator size="large" color="#2D5A27" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <InitialLayout />
    </QueryClientProvider>
  );
}
