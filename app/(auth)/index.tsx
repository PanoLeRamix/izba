import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LanguageToggle } from '../../components/LanguageToggle';
import { LAYOUT } from '../../constants/Layout';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { getErrorCode, isNetworkError } from '../../utils/errors';

export default function JoinHouse() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setHouseSession } = useAuthStore();

  const handleJoin = async () => {
    if (!code) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const session = await authService.joinHouse(code.trim().toUpperCase());
      await setHouseSession(session.houseId, session.houseToken);
      router.push('/(auth)/select-user');
    } catch (error: unknown) {
      const message = isNetworkError(error)
        ? t('common.networkError')
        : getErrorCode(error) === 'P0001'
          ? t('auth.invalidCode')
          : t('common.error');

      setErrorMsg(message);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-hearth px-6"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
      }}
    >
      <View className="flex-row justify-between items-center mb-8" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Text className="text-3xl font-bold text-forest-dark">{t('auth.title')}</Text>
        <LanguageToggle />
      </View>

      <Input
        label={t('auth.enterCode')}
        value={code}
        onChangeText={(text) => {
          setCode(text);
          if (errorMsg) setErrorMsg(null);
        }}
        placeholder={t('auth.codePlaceholder')}
        autoCapitalize="characters"
      />

      {errorMsg ? (
        <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100">
          <Text className="text-red-600 font-medium">{errorMsg}</Text>
        </View>
      ) : null}

      <View className="mt-4">
        <Button title={t('auth.confirm')} onPress={handleJoin} loading={loading} disabled={!code} />
      </View>

      <View className="mt-8 pt-8 border-t border-sage/20">
        <Button title={t('auth.createHouse')} onPress={() => router.push('/(auth)/create')} variant="outline" />
      </View>
    </View>
  );
}
