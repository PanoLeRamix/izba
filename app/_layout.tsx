import { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { initI18n } from '../services/i18n';
import { ConnectionBanner } from '../components/ConnectionBanner';
import '../global.css';

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
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
      <ConnectionBanner />
    </View>
  );
}

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const { t } = useTranslation();

  const queryClient = useMemo(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error: any) => {
        if (error?.message?.includes('Fetch') || error?.message?.includes('network')) {
          Alert.alert(t('common.error'), t('common.loadError'));
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any) => {
        Alert.alert(t('common.error'), t('common.syncError'));
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // Don't retry if it's a 404 or other permanent error
          if (error?.status === 404) return false;
          return failureCount < 3;
        },
      },
    },
  }), [t]);

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

