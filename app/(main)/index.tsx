import React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';

export default function MainIndex() {
  const { logout } = useAuthStore();
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-2xl font-bold mb-8">{t('main.welcome')}</Text>
      
      <Button 
        title="Se déconnecter" 
        onPress={logout} 
        variant="outline"
      />
    </View>
  );
}
