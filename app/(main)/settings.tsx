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
  <View style={{ backgroundColor: Colors.tileBackground }} className="p-6 rounded-3xl mb-6 border border-sage/30 shadow-sm overflow-hidden">
    <View className="flex-row items-center mb-4 bg-transparent">
      <View className="bg-forest/10 p-3 rounded-2xl mr-4">{icon}</View>
      <View className="flex-1 bg-transparent">
        <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">{label}</Text>
        <View className="flex-row items-center bg-transparent">
          <Text className="text-2xl font-bold text-forest-dark flex-1">{value}</Text>
          {onEdit ? (
            <TouchableOpacity onPress={onEdit} className="p-2 ml-2 bg-white/50 rounded-xl">
              <Pencil size={16} color={Colors.forest} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
    {children}
  </View>
);

export default function Settings() {
  const { logout, houseId, houseToken, userId, userToken } = useAuthStore();
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
    onSuccess: (data, variables) => {
      if (variables.target === 'house' && houseId && data) {
        queryClient.setQueryData(['house', houseId], data);
      }

      if (variables.target === 'user' && userId && data) {
        queryClient.setQueryData(['user', userId], data);
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
    <View className="flex-1 bg-hearth" style={{ paddingTop: LAYOUT.getTopPadding(insets.top) }}>
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-forest-dark uppercase">{t('tabs.home')}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
          paddingHorizontal: 24,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SettingTile icon={<Home size={24} color={Colors.forest} />} label={t('main.house')} value={house?.name || ''} onEdit={() => openEditModal('house')}>
          <TouchableOpacity
            onPress={() => copy(house?.code || '')}
            className="bg-forest/5 p-4 rounded-2xl flex-row items-center justify-between border border-forest/10"
            activeOpacity={0.6}
          >
            <View className="flex-1 bg-transparent">
              <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[1px] mb-0.5">{t('main.inviteCode')}</Text>
              <Text className="text-lg font-mono font-bold text-forest">{house?.code}</Text>
            </View>
            <View className="bg-white/50 p-2 rounded-xl">
              {copied ? <Check size={18} color={Colors.forest} /> : <Copy size={18} color={Colors.forest} />}
            </View>
          </TouchableOpacity>
        </SettingTile>

        <SettingTile icon={<User size={24} color={Colors.forest} />} label={t('main.identity')} value={user?.name || ''} onEdit={() => openEditModal('user')} />

        <LanguageToggle variant="tile" />

        <View className="mb-6">
          <Button title={t('main.logout')} onPress={() => void logout()} variant="outline" icon={<LogOut size={20} color={Colors.forest} />} />
        </View>
      </ScrollView>

      <InputModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSave}
        onDelete={editTarget === 'user' ? handleDeleteIdentity : undefined}
        title={editTarget === 'house' ? t('auth.houseName') : t('auth.memberName')}
        initialValue={editTarget === 'house' ? house?.name : user?.name}
        placeholder={editTarget === 'house' ? t('auth.houseNamePlaceholder') : t('auth.memberNamePlaceholder')}
        loading={updateMutation.isPending}
        maxLength={20}
      />
    </View>
  );
}
