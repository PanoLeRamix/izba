import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react-native';
import { storage } from '../utils/storage';
import { Colors } from '../constants/Colors';

interface LanguageToggleProps {
  variant?: 'button' | 'tile';
}

export const LanguageToggle = ({ variant = 'button' }: LanguageToggleProps) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLng = i18n.language === 'fr' ? 'en' : 'fr';
    await i18n.changeLanguage(newLng);
    await storage.setItem('user-language', newLng);
  };

  if (variant === 'tile') {
    return (
      <TouchableOpacity 
        onPress={toggleLanguage}
        style={{ backgroundColor: Colors.tileBackground }}
        className="p-6 rounded-3xl mb-12 border border-sage/30 shadow-sm flex-row items-center overflow-hidden"
        activeOpacity={0.7}
      >
        <View className="bg-forest/10 p-3 rounded-2xl mr-4">
          <Languages size={24} color={Colors.forest} />
        </View>
        <View className="flex-1 bg-transparent">
          <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">
            {t('common.appLanguage')}
          </Text>
          <Text className="text-xl font-bold text-forest-dark">
            {i18n.language === 'fr' ? 'Français' : 'English'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={toggleLanguage}
      style={{ backgroundColor: Colors.whiteAlpha50 }}
      className="p-3 rounded-2xl border border-sage/20"
      activeOpacity={0.7}
    >
      <Languages size={20} color={Colors.forest} />
    </TouchableOpacity>
  );
};
