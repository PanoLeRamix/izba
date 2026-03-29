import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { LanguageToggle } from '../../components/LanguageToggle';
import { LAYOUT } from '../../constants/Layout';

export default function JoinHouse() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setHouseId } = useAuthStore();

  const handleJoin = async () => {
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('id')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (error || !data) {
        setErrorMsg(t('auth.invalidCode'));
        Alert.alert(t('common.error'), t('auth.invalidCode'));
        return;
      }

      await setHouseId(data.id);
      router.push({
        pathname: '/(auth)/select-user',
        params: { houseId: data.id }
      });
    } catch (e) {
      setErrorMsg(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View 
      className="flex-1 bg-hearth px-6"
      style={{ 
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING)
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


      {errorMsg && (
        <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100">
          <Text className="text-red-600 font-medium">{errorMsg}</Text>
        </View>
      )}

      <View className="mt-4">
        <Button 
          title={t('auth.confirm')} 
          onPress={handleJoin} 
          loading={loading}
          disabled={!code}
        />
      </View>

      <View className="mt-8 pt-8 border-t border-sage/20">
        <Button 
          title={t('auth.createHouse')} 
          onPress={() => router.push('/(auth)/create')} 
          variant="outline"
        />
      </View>
    </View>
  );
}
