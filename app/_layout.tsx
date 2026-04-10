import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { Colors } from '../constants/Colors';
import { initI18n } from '../services/i18n';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage, getErrorStatus, isNetworkError } from '../utils/errors';
import '../global.css';

function InitialLayout() {
  const { houseId, houseToken, userId, userToken, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLoggedIn = !!(houseId && houseToken && userId && userToken);

    if (isLoggedIn && inAuthGroup) {
      router.replace('/(main)');
    } else if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [houseId, houseToken, isInitialized, router, segments, userId, userToken]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={Colors.primary} />
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
  const { initialize, logout } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const { t } = useTranslation();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: unknown) => {
            const message = getErrorMessage(error).toLowerCase();

            if (message.includes('invalid') && message.includes('session')) {
              void logout();
              return;
            }

            if (isNetworkError(error)) {
              Alert.alert(t('common.error'), t('common.loadError'));
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: unknown) => {
            const message = getErrorMessage(error).toLowerCase();

            if (message.includes('invalid') && message.includes('session')) {
              void logout();
              return;
            }

            Alert.alert(t('common.error'), t('common.syncError'));
          },
        }),
        defaultOptions: {
          queries: {
            retry: (failureCount, error: unknown) => {
              if (getErrorStatus(error) === 404) return false;
              return failureCount < 3;
            },
          },
        },
      }),
    [logout, t],
  );

  useEffect(() => {
    const setup = async () => {
      await initI18n();
      await initialize();
      setAppReady(true);
    };

    void setup();
  }, [initialize]);

  if (!appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <InitialLayout />
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
