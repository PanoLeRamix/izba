import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LanguageToggle } from '../../components/LanguageToggle';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';

export default function AuthIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHouseSession } = useAuthStore();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: (houseCode: string) => authService.joinHouse(houseCode),
    onSuccess: async (data) => {
      if (data) {
        queryClient.setQueryData(['house', data.houseId], data);
        await setHouseSession(data.houseId, data.houseToken, data.houseName);
        router.push('/(auth)/select-user');
      }
    },
    onError: (error: unknown) => {
      const message = isNetworkError(error) ? t('common.networkError') : t('auth.invalidCode');
      setErrorMsg(message);
      Alert.alert(t('common.error'), message);
    },
  });

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    joinMutation.mutate(trimmed);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        className="flex-1 bg-surface px-6"
      >
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-3xl font-bold text-primary flex-1 mr-4">{t('auth.title')}</Text>
          <LanguageToggle variant="discrete" />
        </View>

        <View className="space-y-6">
          <Input
            label={t('auth.enterCode')}
            placeholder={t('auth.codePlaceholder')}
            value={code}
            onChangeText={(val) => {
              setCode(val);
              setErrorMsg(null);
            }}
            autoCapitalize="characters"
            error={errorMsg ?? undefined}
          />

          <Button title={t('auth.joinHouse')} onPress={handleJoin} loading={joinMutation.isPending} disabled={!code.trim()} />

          <View className="mt-8 pt-8 border-t border-outline-variant/10">
            <Button title={t('auth.createHouse')} variant="outline" onPress={() => router.push('/(auth)/create')} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
