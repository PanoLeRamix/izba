import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { UserPlus } from 'lucide-react-native';

export default function SelectUser() {
  const { houseId: paramHouseId } = useLocalSearchParams<{ houseId: string }>();
  const { houseId: storeHouseId, setAuth } = useAuthStore();
  
  // Use param if available, otherwise fallback to store
  const houseId = paramHouseId || storeHouseId;

  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  
  const { t } = useTranslation();

  const fetchUsers = async () => {
    if (!houseId) return;
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('house_id', houseId);

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [houseId]);

  const handleSelect = async (userId: string) => {
    if (!houseId) return;
    await setAuth(houseId, userId);
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !houseId) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({ name: newName.trim(), house_id: houseId })
        .select()
        .single();

      if (error) throw error;
      
      await handleSelect(data.id);
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-6 pt-20">
      <Text className="text-3xl font-bold mb-8 text-gray-800">{t('auth.selectIdentity')}</Text>
      
      {!showAddForm ? (
        <>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="w-full bg-gray-100 p-6 rounded-2xl mb-4"
                onPress={() => handleSelect(item.id)}
              >
                <Text className="text-xl font-medium text-gray-800">{item.name}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity 
                className="w-full border-2 border-dashed border-gray-300 p-6 rounded-2xl mb-4 flex-row items-center justify-center"
                onPress={() => setShowAddForm(true)}
              >
                <Text className="text-gray-500 font-bold text-2xl mr-2">+</Text>
                <Text className="text-xl font-medium text-gray-500">{t('auth.addPerson')}</Text>
              </TouchableOpacity>
            }
          />
        </>
      ) : (
        <View className="mt-4">
          <Input 
            label={t('auth.memberName')}
            value={newName}
            onChangeText={setNewName}
            placeholder="Jean-Michel"
          />
          <View className="mt-4">
            <Button 
              title={t('auth.confirm')} 
              onPress={handleAddUser} 
              loading={adding}
            />
          </View>
          <View className="mt-4">
            <Button 
              title={t('common.back')} 
              variant="outline"
              onPress={() => setShowAddForm(false)} 
            />
          </View>
        </View>
      )}
    </View>
  );
}
