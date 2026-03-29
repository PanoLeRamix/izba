import React, { useState } from 'react';
import { View, Text, Alert, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';

export default function CreateHouse() {
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [newHouseId, setNewHouseId] = useState('');
  const { copied, copy } = useCopyToClipboard();
  const insets = useSafeAreaInsets();
  
  const router = useRouter();
  const { t } = useTranslation();
  const { setHouseId } = useAuthStore();

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async () => {
    if (!houseName.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    const code = generateCode();

    try {
      const { data: house, error: houseError } = await supabase
        .from('houses')
        .insert({ name: houseName.trim(), code })
        .select()
        .single();

      if (houseError) throw houseError;

      setGeneratedCode(code);
      setNewHouseId(house.id);
      setShowModal(true);
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await copy(generatedCode);
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    await setHouseId(newHouseId);
    router.push({
      pathname: '/(auth)/select-user',
      params: { houseId: newHouseId }
    });
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
        <Text className="text-3xl font-bold text-forest-dark">{t('auth.createHouse')}</Text>
        <LanguageToggle />
      </View>
      
      <Input
        label={t('auth.houseName')}
        value={houseName}
        onChangeText={setHouseName}
        placeholder={t('auth.houseNamePlaceholder')}
      />


      <View className="mt-6">
        <Button 
          title={t('auth.confirm')} 
          onPress={handleCreate} 
          loading={loading}
          disabled={!houseName.trim()}
        />
      </View>

      <View className="mt-4">
        <Button 
          title={t('common.back')} 
          variant="outline"
          onPress={() => router.back()} 
        />
      </View>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-forest-dark/40 p-6">
          <View className="bg-hearth w-full p-8 rounded-3xl items-center border border-sage/20 shadow-xl">
            <Text className="text-2xl font-bold mb-2 text-forest-dark">{t('auth.houseCreated')}</Text>
            <Text className="text-hearth-earth/70 mb-6 text-center">{t('auth.shareCodeHint')}</Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: Colors.sageLight + '4D' }} // SageLight with 30% opacity equivalent
              className="p-6 rounded-2xl mb-8 w-full items-center border border-sage/30"
              onPress={copyToClipboard}
              activeOpacity={0.7}
            >
              <Text className="text-4xl font-mono font-bold tracking-widest text-forest">
                {generatedCode}
              </Text>
              <View className="flex-row items-center mt-2">
                {copied ? (
                  <>
                    <Check size={14} color={Colors.forest} style={{ marginRight: 4 }} />
                    <Text className="text-forest font-bold text-xs uppercase tracking-widest">{t('main.copied')}</Text>
                  </>
                ) : (
                  <Text className="text-forest/50 text-xs uppercase font-bold tracking-widest">{t('main.copyCode')}</Text>
                )}
              </View>
            </TouchableOpacity>

            <Button 
              title={t('auth.continue')} 
              onPress={handleCloseModal} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
