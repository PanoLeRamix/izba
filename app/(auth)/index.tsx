import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export default function JoinHouse() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { setHouseId } = useAuthStore();

  const handleJoin = async () => {
    if (!code) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('id')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (error || !data) {
        Alert.alert(t('common.error'), t('auth.invalidCode'));
        return;
      }

      await setHouseId(data.id);
      // Redirection to select-user happens via RootLayout if houseId is set but userId is not
      router.push({
        pathname: '/(auth)/select-user',
        params: { houseId: data.id }
      });
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 pt-20">
      <Text className="text-3xl font-bold mb-8 text-gray-800">{t('auth.title')}</Text>
      
      <Input
        label={t('auth.enterCode')}
        value={code}
        onChangeText={setCode}
        placeholder="ABC-123"
        autoCapitalize="characters"
      />

      <View className="mt-4">
        <Button 
          title={t('auth.confirm')} 
          onPress={handleJoin} 
          loading={loading}
          disabled={!code}
        />
      </View>

      <View className="mt-8 pt-8 border-t border-gray-100">
        <Button 
          title={t('auth.createHouse')} 
          onPress={() => router.push('/(auth)/create')} 
          variant="outline"
        />
      </View>
    </View>
  );
}
