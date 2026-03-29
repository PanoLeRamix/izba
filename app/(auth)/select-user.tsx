import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { UserPlus } from 'lucide-react-native';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Colors } from '../../constants/Colors';

export default function SelectUser() {
  const { houseId: paramHouseId } = useLocalSearchParams<{ houseId: string }>();
  const { houseId: storeHouseId, setAuth } = useAuthStore();
  
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
      <View className="flex-1 items-center justify-center bg-hearth">
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-hearth p-6 pt-20">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-bold text-forest-dark">{t('auth.selectIdentity')}</Text>
        <LanguageToggle />
      </View>
      
      {!showAddForm ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="w-full bg-sage-light/30 p-6 rounded-2xl mb-4 border border-sage/20"
              onPress={() => handleSelect(item.id)}
            >
              <Text className="text-xl font-medium text-forest-dark">{item.name}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity 
              className="w-full border-2 border-dashed border-sage p-6 rounded-2xl mb-4 flex-row items-center justify-center"
              onPress={() => setShowAddForm(true)}
            >
              <UserPlus size={24} color={Colors.forest} style={{ marginRight: 8 }} />
              <Text className="text-xl font-medium text-forest">{t('auth.addPerson')}</Text>
            </TouchableOpacity>
          }
        />
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
