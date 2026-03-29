import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function Planner() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-hearth pt-16 px-6">
      <Text className="text-2xl font-bold text-forest-dark">{t('tabs.planner')}</Text>
    </View>
  );
}
