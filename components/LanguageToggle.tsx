import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, Languages, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';
import { storage } from '../utils/storage';
import { BottomSheetModal } from './BottomSheetModal';

interface LanguageToggleProps {
  variant?: 'default' | 'discrete';
}

export const LanguageToggle = ({ variant = 'default' }: LanguageToggleProps) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇰🇳' }, // Saint Kitts and Nevis
    { code: 'fr', label: 'Français', flag: '🇸🇨' }, // Seychelles
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const selectLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    await storage.setItem('user-language', code);
    setModalVisible(false);
  };

  if (variant === 'discrete') {
    return (
      <>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center bg-white/80 shadow-sm px-3 py-2 rounded-xl border border-secondary-container/30"
          activeOpacity={0.7}
        >
          <Languages size={18} color={Colors.primary} strokeWidth={2.5} />
          <Text className="ml-2 text-xs font-bold text-primary uppercase">
            {i18n.language.toUpperCase()}
          </Text>
        </TouchableOpacity>
        <LanguageModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onSelect={selectLanguage}
          languages={languages}
          currentLanguageCode={i18n.language}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center pt-4 pb-2 border-t border-outline-variant/10"
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text className="text-lg font-black text-primary">{currentLanguage.label}</Text>
          <Text className="text-[10px] text-on-surface-variant/50 uppercase font-black tracking-[1.5px]">
            {t('common.appLanguage')}
          </Text>
        </View>
        <View className="flex-row items-center bg-primary/5 px-3 py-2 rounded-xl">
          <Languages size={16} color={Colors.primary} strokeWidth={2.5} className="mr-2" />
          <ChevronDown size={14} color={Colors.primary} strokeWidth={3} />
        </View>
      </TouchableOpacity>

      <LanguageModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSelect={selectLanguage}
        languages={languages}
        currentLanguageCode={i18n.language}
      />
    </>
  );
};

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  languages: Array<{ code: string; label: string; flag: string }>;
  currentLanguageCode: string;
}

const LanguageModal = ({ visible, onClose, onSelect, languages, currentLanguageCode }: LanguageModalProps) => {
  const { t } = useTranslation();
  
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      header={
        <Text className="text-2xl font-black text-primary uppercase tracking-tight mb-6 text-center">
          {t('common.appLanguage')}
        </Text>
      }
    >
      <View className="gap-3">
        {languages.map((lang) => {
          const isSelected = lang.code === currentLanguageCode;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => void onSelect(lang.code)}
              style={{ 
                backgroundColor: isSelected ? Colors.primary : Colors.surface,
                borderColor: isSelected ? Colors.primary : Colors.outlineVariant,
                borderWidth: 1
              }}
              className="flex-row items-center p-5 rounded-[2rem] shadow-sm"
            >
              <Text className="text-2xl mr-4">{lang.flag}</Text>
              <Text 
                className={`flex-1 text-lg font-black ${isSelected ? 'text-on-primary' : 'text-primary'}`}
              >
                {lang.label}
              </Text>
              {isSelected && <Check size={20} color={Colors.onPrimary} strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheetModal>
  );
};
