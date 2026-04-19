import React, { type ReactNode, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Home, LogOut, Pencil, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { InputModal } from '../../components/InputModal';
import { LanguageToggle } from '../../components/LanguageToggle';
import { SettingsSkeleton } from '../../components/settings/SettingsSkeleton';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { houseService } from '../../services/house';
import { userService } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';

interface SettingTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  onEdit?: () => void;
  children?: ReactNode;
}

const SettingTile = ({ icon, label, value, onEdit, children }: SettingTileProps) => (
  <View style={{ backgroundColor: Colors.surfaceContainerLow }} className="p-6 rounded-3xl mb-6 border border-outline-variant/20 shadow-sm overflow-hidden">
    <View className="flex-row items-center mb-4 bg-transparent">
      <View className="bg-primary/5 p-3 rounded-2xl mr-4">{icon}</View>
      <View className="flex-1 bg-transparent">
        <Text className="text-[10px] text-tertiary/40 uppercase font-bold tracking-[2px] mb-1">{label}</Text>
        <View className="flex-row items-center bg-transparent">
          <Text className="text-2xl font-bold text-primary flex-1">{value}</Text>
          {onEdit ? (
            <TouchableOpacity onPress={onEdit} className="p-2 ml-2 bg-surface-container-lowest rounded-xl">
              <Pencil size={16} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
    {children}
  </View>
);

export default function Settings() {
  const { logout, houseId, houseToken, userId, userToken, setUserSession, houseName, userName } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<'house' | 'user' | null>(null);

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
        // Sync to store
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
        // Sync to store
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
      setEditModalVisible(false);
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
    setEditModalVisible(false);

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

  const openEditModal = (target: 'house' | 'user') => {
    setEditTarget(target);
    setEditModalVisible(true);
  };

  const handleSave = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || !editTarget) return;
    updateMutation.mutate({ target: editTarget, value: trimmedValue });
  };

  if (loadingHouse || loadingUser) {
    return <SettingsSkeleton />;
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: LAYOUT.getTopPadding(insets.top) }}>
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-primary uppercase">{t('tabs.settings')}</Text>
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
        <SettingTile icon={<Home size={24} color={Colors.primary} />} label={t('main.house')} value={house?.name || houseName || ''} onEdit={() => openEditModal('house')}>
          <TouchableOpacity
            onPress={() => copy(house?.code || '')}
            className="bg-primary/5 p-4 rounded-2xl flex-row items-center justify-between border border-outline-variant/10"
            activeOpacity={0.6}
          >
            <View className="flex-1 bg-transparent">
              <Text className="text-[10px] text-tertiary/40 uppercase font-bold tracking-[1px] mb-0.5">{t('main.inviteCode')}</Text>
              <Text className="text-lg font-mono font-bold text-primary">{house?.code}</Text>
            </View>
            <View className="bg-surface-container-lowest/50 p-2 rounded-xl">
              {copied ? <Check size={18} color={Colors.primary} /> : <Copy size={18} color={Colors.primary} />}
            </View>
          </TouchableOpacity>
        </SettingTile>

        <SettingTile icon={<User size={24} color={Colors.primary} />} label={t('main.identity')} value={user?.name || userName || ''} onEdit={() => openEditModal('user')} />

        <LanguageToggle variant="tile" />

        <View className="mb-6">
          <Button title={t('main.logout')} onPress={() => void logout()} variant="outline" icon={<LogOut size={20} color={Colors.primary} />} />
        </View>
      </ScrollView>

      <InputModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSave}
        onDelete={editTarget === 'user' ? handleDeleteIdentity : undefined}
        deleteTitle={t('main.deleteIdentity')}
        title={editTarget === 'house' ? t('auth.houseName') : t('auth.memberName')}
        initialValue={editTarget === 'house' ? house?.name ?? houseName ?? undefined : user?.name ?? userName ?? undefined}
        placeholder={editTarget === 'house' ? t('auth.houseNamePlaceholder') : t('auth.memberNamePlaceholder')}
        loading={updateMutation.isPending}
        maxLength={20}
      />
    </View>
  );
}
