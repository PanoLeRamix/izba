import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';

export default function SelectUser() {
  const { houseId, houseToken, setUserSession, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!houseToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.listHouseUsers(houseToken);
        setUsers(data.map(({ id, name }) => ({ id, name })));
      } catch (error: unknown) {
        Alert.alert(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('common.loadError'));
        await logout();
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [houseToken, logout, t]);

  const handleSelect = async (selectedUserId: string) => {
    if (!houseId || !houseToken) return;

    try {
      const session = await authService.selectUser(houseToken, selectedUserId);
      await setUserSession({
        houseId,
        houseToken,
        userId: session.id,
        userToken: session.userToken,
      });
    } catch (error: unknown) {
      Alert.alert(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('common.error'));
    }
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !houseId || !houseToken) return;

    setAdding(true);

    try {
      const session = await authService.createUser(houseToken, newName.trim());
      await setUserSession({
        houseId,
        houseToken,
        userId: session.id,
        userToken: session.userToken,
      });
    } catch (error: unknown) {
      Alert.alert(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('common.error'));
    } finally {
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
    <View
      className="flex-1 bg-hearth px-6"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
      }}
    >
      <View className="flex-row justify-between items-center mb-8" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Text className="text-3xl font-bold text-forest-dark">{t('auth.selectIdentity')}</Text>
        <LanguageToggle />
      </View>

      {!showAddForm ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: LAYOUT.BASE_SCREEN_PADDING }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="w-full bg-sage-light/30 p-6 rounded-2xl mb-4 border border-sage/20"
              onPress={() => void handleSelect(item.id)}
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
            placeholder={t('auth.memberNamePlaceholder')}
            maxLength={20}
          />

          <View className="mt-4">
            <Button title={t('auth.confirm')} onPress={handleAddUser} loading={adding} />
          </View>
          <View className="mt-4">
            <Button title={t('common.back')} variant="outline" onPress={() => setShowAddForm(false)} />
          </View>
        </View>
      )}
    </View>
  );
}
