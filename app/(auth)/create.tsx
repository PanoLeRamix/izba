import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/Colors';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';

export default function CreateHouse() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHouseSession } = useAuthStore();
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();

  const [houseName, setHouseName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => authService.createHouse(name),
    onSuccess: (data) => {
      setGeneratedCode(data.code || null);
      queryClient.setQueryData(['house', data.houseId], data);
    },
    onError: (error: unknown) => {
      Alert.alert(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('common.saveError'));
    },
  });

  const handleCreate = () => {
    const trimmed = houseName.trim();
    if (!trimmed) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    createMutation.mutate(trimmed);
  };

  const handleContinue = async () => {
    if (createMutation.data) {
      await setHouseSession(createMutation.data.houseId, createMutation.data.houseToken, createMutation.data.houseName);
      router.replace('/(auth)/select-user');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        className="flex-1 bg-surface px-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="py-4 mb-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-primary mb-8">{t('auth.createHouse')}</Text>

        <View className="space-y-6">
          <Input
            label={t('auth.houseName')}
            placeholder={t('auth.houseNamePlaceholder')}
            value={houseName}
            onChangeText={setHouseName}
            autoFocus
            maxLength={25}
          />

          <Button title={t('auth.save')} onPress={handleCreate} loading={createMutation.isPending} disabled={!houseName.trim()} />
        </View>

        {generatedCode ? (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-50 flex-1 justify-center items-center bg-primary/40 p-6">
            <View className="bg-surface w-full p-8 rounded-3xl items-center border border-outline-variant/20 shadow-xl">
              <Text className="text-2xl font-bold mb-2 text-primary">{t('auth.houseCreated')}</Text>
              <Text className="text-tertiary/70 mb-6 text-center">{t('auth.shareCodeHint')}</Text>

              <TouchableOpacity
                onPress={() => copy(generatedCode)}
                style={{ backgroundColor: `${Colors.secondaryContainer}4D` }}
                className="p-6 rounded-2xl mb-8 w-full items-center border border-outline-variant/30"
              >
                <Text className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mb-2">{t('auth.yourCode')}</Text>
                <Text className="text-4xl font-mono font-bold tracking-widest text-primary">{generatedCode}</Text>
                <View className="mt-4 flex-row items-center">
                  {copied ? (
                    <>
                      <Check size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                      <Text className="text-primary font-bold text-xs uppercase tracking-widest">{t('main.copied')}</Text>
                    </>
                  ) : (
                    <Text className="text-primary/50 text-xs uppercase font-bold tracking-widest">{t('main.copyCode')}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <Button title={t('auth.continue')} onPress={() => void handleContinue()} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
