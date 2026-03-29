import React, { useState } from 'react';
import { View, Text, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export default function CreateHouse() {
  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [newHouseId, setNewHouseId] = useState('');
  
  const router = useRouter();
  const { t } = useTranslation();
  const { setHouseId } = useAuthStore();

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
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

  const handleCloseModal = async () => {
    setShowModal(false);
    await setHouseId(newHouseId);
    router.push({
      pathname: '/(auth)/select-user',
      params: { houseId: newHouseId }
    });
  };

  return (
    <View className="flex-1 bg-white p-6 pt-20">
      <Text className="text-3xl font-bold mb-8 text-gray-800">{t('auth.createHouse')}</Text>
      
      <Input
        label={t('auth.houseName')}
        value={houseName}
        onChangeText={setHouseName}
        placeholder="La Coloc"
      />

      <View className="mt-6">
        <Button 
          title={t('auth.confirm')} 
          onPress={handleCreate} 
          loading={loading}
          disabled={!houseName.trim()}
        />
      </View>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white w-full p-8 rounded-3xl items-center">
            <Text className="text-2xl font-bold mb-2 text-gray-800">{t('auth.houseCreated')}</Text>
            <Text className="text-gray-600 mb-6 text-center">{t('auth.shareCodeHint')}</Text>
            
            <View className="bg-gray-100 p-6 rounded-2xl mb-8 w-full items-center">
              <Text className="text-4xl font-mono font-bold tracking-widest text-blue-600">
                {generatedCode}
              </Text>
            </View>

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
