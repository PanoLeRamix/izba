import React, { useState, useRef } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Home, LogOut, Pencil, User, UserMinus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/LanguageToggle';
import { SettingsSkeleton } from '../../components/settings/SettingsSkeleton';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { houseService } from '../../services/house';
import { userService } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';

export default function Settings() {
  const { logout, houseId, houseToken, userId, userToken, setUserSession, houseName, userName } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();
  
  const [editingTarget, setEditingTarget] = useState<'house' | 'user' | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { data: house, isLoading: loadingHouse } = useQuery({
    queryKey: ['house', houseId],
    queryFn: () => houseService.getHouse(houseToken!),
    enabled: !!houseId && !!houseToken,
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userToken!),
    enabled: !!userId && !!userToken,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ target, value }: { target: 'house' | 'user'; value: string }) => {
      if (!userToken) {
        throw new Error('Missing user session.');
      }

      return target === 'house' ? houseService.updateName(userToken, value) : userService.updateName(userToken, value);
    },
    onSuccess: async (data, variables) => {
      if (variables.target === 'house' && houseId && data) {
        queryClient.setQueryData(['house', houseId], data);
        await setUserSession({
          houseId: houseId,
          houseToken: houseToken!,
          houseName: data.name,
          userId: userId!,
          userToken: userToken!,
          userName: userName!,
        });
      }

      if (variables.target === 'user' && userId && data) {
        queryClient.setQueryData(['user', userId], data);
        await setUserSession({
          houseId: houseId!,
          houseToken: houseToken!,
          houseName: houseName!,
          userId: userId,
          userToken: userToken!,
          userName: data.name,
        });
      }

      void queryClient.invalidateQueries({
        queryKey: [variables.target, variables.target === 'house' ? houseId : userId],
      });
      setEditingTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userToken) {
        throw new Error('Missing user session.');
      }
      await userService.deleteUser(userToken);
    },
    onSuccess: () => {
      void logout();
    },
    onError: (error: unknown) => {
      Alert.alert(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('common.saveError'));
    },
  });

  const handleDeleteIdentity = () => {
    if (Platform.OS === 'web') {
      if (confirm(t('main.deleteConfirmation'))) {
        deleteMutation.mutate();
      }
      return;
    }

    Alert.alert(t('main.deleteIdentity'), t('main.deleteConfirmation'), [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('auth.confirm'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const startEditing = (target: 'house' | 'user', initialValue: string) => {
    setEditValue(initialValue);
    setEditingTarget(target);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setEditingTarget(null);
    setEditValue('');
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || !editingTarget) return;

    if (editingTarget === 'house') {
      const confirmed = await new Promise((resolve) => {
        if (Platform.OS === 'web') {
          resolve(confirm(`${t('main.renameHouseTitle')}\n\n${t('main.renameHouseConfirmation')}`));
          return;
        }

        Alert.alert(t('main.renameHouseTitle'), t('main.renameHouseConfirmation'), [
          { text: t('common.back'), onPress: () => resolve(false), style: 'cancel' },
          { text: t('auth.confirm'), onPress: () => resolve(true) },
        ]);
      });

      if (!confirmed) return;
    }

    updateMutation.mutate({ target: editingTarget, value: trimmedValue });
  };

  const handleLogout = () => {
    const title = t('main.logoutTitle');
    const message = t('main.logoutConfirmation');

    if (Platform.OS === 'web') {
      if (confirm(`${title}\n\n${message}`)) {
        void logout();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('main.logout'),
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  const topPadding = LAYOUT.getTopPadding(insets.top);

  if (loadingHouse || loadingUser) {
    return <SettingsSkeleton />;
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      {/* Header */}
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-primary uppercase">{t('tabs.settings')}</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          className="p-3 bg-error/5 rounded-2xl border border-error/10"
          activeOpacity={0.7}
        >
          <LogOut size={22} color={Colors.error} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + LAYOUT.TAB_BAR_HEIGHT,
          paddingHorizontal: 24,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* House Section */}
        <View 
          style={{ backgroundColor: Colors.surfaceContainerLow }} 
          className="p-8 pb-4 rounded-[32px] mb-6 border border-outline-variant/10 relative overflow-hidden"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-[10px] text-on-surface-variant/50 uppercase font-black tracking-[1.5px] mb-1">
                {t('main.house')}
              </Text>
              
              {editingTarget === 'house' ? (
                <TextInput
                  ref={inputRef}
                  value={editValue}
                  onChangeText={setEditValue}
                  className="text-2xl font-black text-primary leading-tight p-0"
                  autoFocus
                  placeholder={t('auth.houseNamePlaceholder')}
                  maxLength={20}
                />
              ) : (
                <Text className="text-2xl font-black text-primary leading-tight">
                  {house?.name || houseName}
                </Text>
              )}
            </View>

            {editingTarget === 'house' ? (
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={handleCancel}
                  className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm mr-2"
                >
                  <X size={18} color={Colors.onSurfaceVariant} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSave}
                  disabled={updateMutation.isPending || !editValue.trim()}
                  className="p-3 bg-primary rounded-2xl shadow-sm"
                >
                  <Check size={18} color={Colors.onPrimary} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => startEditing('house', house?.name || houseName || '')}
                className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm"
              >
                <Pencil size={18} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => copy(house?.code || '')}
            className="flex-row items-center py-4 border-t border-outline-variant/10"
            activeOpacity={0.6}
          >
            <View className="flex-1">
              <Text className="text-lg font-black text-primary tracking-widest">{house?.code}</Text>
              <Text className="text-[10px] text-on-surface-variant/50 uppercase font-black tracking-[1.5px]">{t('main.inviteCode')}</Text>
            </View>
            <View className="bg-primary/5 p-2 rounded-xl">
              {copied ? <Check size={18} color={Colors.primary} strokeWidth={3} /> : <Copy size={18} color={Colors.primary} strokeWidth={2.5} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile & App Section */}
        <View 
          style={{ backgroundColor: Colors.surfaceContainerLow }} 
          className="p-8 pb-4 rounded-[32px] mb-6 border border-outline-variant/10 relative overflow-hidden"
        >
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1 pr-4">
              <Text className="text-[10px] text-on-surface-variant/50 uppercase font-black tracking-[1.5px] mb-1">
                {t('main.identity')}
              </Text>

              {editingTarget === 'user' ? (
                <TextInput
                  ref={inputRef}
                  value={editValue}
                  onChangeText={setEditValue}
                  className="text-2xl font-black text-primary leading-tight p-0"
                  autoFocus
                  placeholder={t('auth.memberNamePlaceholder')}
                  maxLength={20}
                />
              ) : (
                <Text className="text-2xl font-black text-primary leading-tight">
                  {user?.name || userName}
                </Text>
              )}
            </View>

            {editingTarget === 'user' ? (
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={handleDeleteIdentity}
                  className="p-3 bg-error/5 rounded-2xl border border-error/10 mr-2"
                >
                  <UserMinus size={18} color={Colors.error} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleCancel}
                  className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm mr-2"
                >
                  <X size={18} color={Colors.onSurfaceVariant} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSave}
                  disabled={updateMutation.isPending || !editValue.trim()}
                  className="p-3 bg-primary rounded-2xl shadow-sm"
                >
                  <Check size={18} color={Colors.onPrimary} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => startEditing('user', user?.name || userName || '')}
                className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm"
              >
                <Pencil size={18} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <LanguageToggle />
        </View>
      </ScrollView>
    </View>
  );
}
