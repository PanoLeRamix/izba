import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputModal } from '../../components/InputModal';
import { Colors } from '../../constants/Colors';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';

export default function SelectUser() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { houseId, houseToken, houseName, setUserSession } = useAuthStore();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['house-users', houseId],
    queryFn: () => authService.listHouseUsers(houseToken!),
    enabled: !!houseId && !!houseToken,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => authService.createUser(houseToken!, name),
    onSuccess: (data) => {
      // Invalidate users list
      void queryClient.invalidateQueries({ queryKey: ['house-users', houseId] });
      setModalVisible(false);
    },
  });

  const handleSelectUser = async (user: { id: string; name: string }) => {
    if (!houseId || !houseToken || !houseName) return;
    
    try {
      const session = await authService.selectUser(houseToken, user.id);
      
      await setUserSession({
        houseId,
        houseToken,
        houseName,
        userId: session.id,
        userToken: session.userToken,
        userName: session.name,
      });
      
      router.replace('/(main)');
    } catch (error) {
      console.error('Failed to select user:', error);
    }
  };

  const handleCreateUser = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <View
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        className="flex-1 bg-surface px-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="py-4 mb-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-primary mb-8">{t('auth.selectIdentity')}</Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => void handleSelectUser(item)}
                className="w-full bg-surface-container-low p-6 rounded-2xl mb-4 border border-outline-variant/10"
              >
                <Text className="text-xl font-medium text-primary">{item.name}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
                className="w-full border-2 border-dashed border-outline-variant p-6 rounded-2xl mb-4 flex-row items-center justify-center"
              >
                <UserPlus size={24} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text className="text-xl font-medium text-primary">{t('auth.addPerson')}</Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>

      <InputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreateUser}
        title={t('auth.addMember')}
        placeholder={t('auth.memberNamePlaceholder')}
        loading={createMutation.isPending}
        maxLength={20}
      />
    </KeyboardAvoidingView>
  );
}
