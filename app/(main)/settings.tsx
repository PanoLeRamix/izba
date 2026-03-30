import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTranslation } from 'react-i18next';
import { houseService } from '../../services/house';
import { userService } from '../../services/user';
import { SettingsSkeleton } from '../../components/settings/SettingsSkeleton';
import { Copy, Home, User, LogOut, Check, Pencil } from 'lucide-react-native';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';

interface SettingTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  onEdit?: () => void;
  children?: ReactNode;
}

const SettingTile = ({ icon, label, value, onEdit, children }: SettingTileProps) => (
  <View 
    style={{ backgroundColor: Colors.tileBackground }}
    className="p-6 rounded-3xl mb-6 border border-sage/30 shadow-sm overflow-hidden"
  >
    <View className="flex-row items-center mb-4 bg-transparent">
      <View className="bg-forest/10 p-3 rounded-2xl mr-4">
        {icon}
      </View>
      <View className="flex-1 bg-transparent">
        <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">
          {label}
        </Text>
        <View className="flex-row items-center bg-transparent">
          <Text className="text-2xl font-bold text-forest-dark flex-1">
            {value}
          </Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} className="p-2 ml-2 bg-white/50 rounded-xl">
              <Pencil size={16} color={Colors.forest} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
    {children}
  </View>
);

export default function Settings() {
  const { logout, houseId, userId } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();

  // Editing state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<'house' | 'user' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const { data: house, isLoading: loadingHouse } = useQuery({
    queryKey: ['house', houseId],
    queryFn: () => houseService.getHouse(houseId!),
    enabled: !!houseId,
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId!),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ target, value }: { target: 'house' | 'user', value: string }) => {
      if (target === 'house') {
        return houseService.updateName(houseId!, value);
      } else {
        return userService.updateName(userId!, value);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.target, variables.target === 'house' ? houseId : userId] });
      setEditModalVisible(false);
    },
    // onError is handled globally in _layout.tsx
  });

  // Web-specific visual viewport tracking
  useEffect(() => {
    if (Platform.OS !== 'web' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    if (editModalVisible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalVisible]);

  const openEditModal = (target: 'house' | 'user') => {
    setEditTarget(target);
    setEditValue(target === 'house' ? house?.name || '' : user?.name || '');
    setEditModalVisible(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || !editTarget) return;
    updateMutation.mutate({ target: editTarget, value: trimmedValue });
  };

  if (loadingHouse || loadingUser) {
    return <SettingsSkeleton />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-hearth"
      contentContainerStyle={{ 
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
        paddingHorizontal: 24
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-12" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Text className="text-4xl mb-2">🌲</Text>
        <Text className="text-3xl font-bold text-forest-dark text-center">{t('main.welcome')}</Text>
      </View>

      <SettingTile 
        icon={<Home size={24} color={Colors.forest} />}
        label={t('main.house')}
        value={house?.name || ''}
        onEdit={() => openEditModal('house')}
      >
        <TouchableOpacity 
          onPress={() => copy(house?.code || '')}
          className="bg-forest/5 p-4 rounded-2xl flex-row items-center justify-between border border-forest/10"
          activeOpacity={0.6}
        >
          <View className="flex-1 bg-transparent">
            <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[1px] mb-0.5">
              {t('main.inviteCode')}
            </Text>
            <Text className="text-lg font-mono font-bold text-forest">{house?.code}</Text>
          </View>
          <View className="bg-white/50 p-2 rounded-xl">
            {copied ? (
              <Check size={18} color={Colors.forest} />
            ) : (
              <Copy size={18} color={Colors.forest} />
            )}
          </View>
        </TouchableOpacity>
      </SettingTile>

      <SettingTile 
        icon={<User size={24} color={Colors.forest} />}
        label={t('main.identity')}
        value={user?.name || ''}
        onEdit={() => openEditModal('user')}
      />

      <LanguageToggle variant="tile" />
      
      <View className="mt-8">
        <Button 
          title={t('main.logout')} 
          onPress={logout} 
          variant="outline"
          icon={<LogOut size={20} color={Colors.forest} />}
        />
      </View>

      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View 
          className="flex-1 justify-center items-center bg-forest-dark/40 p-6"
          style={Platform.OS === 'web' ? { paddingBottom: keyboardOffset } : {}}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full items-center"
          >
            <View className="bg-hearth w-full p-8 rounded-3xl border border-sage/20 shadow-xl max-w-md">
              <Text className="text-2xl font-bold mb-6 text-forest-dark">
                {editTarget === 'house' ? t('auth.houseName') : t('auth.memberName')}
              </Text>
              
              <Input 
                ref={inputRef}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={editTarget === 'house' ? t('auth.houseNamePlaceholder') : t('auth.memberNamePlaceholder')}
              />

              <View className="mt-4">
                <Button 
                  title={t('auth.save')} 
                  onPress={handleSave} 
                  loading={updateMutation.isPending}
                  disabled={!editValue.trim()}
                />
              </View>
              <View className="mt-4">
                <Button 
                  title={t('common.back')} 
                  variant="outline"
                  onPress={() => setEditModalVisible(false)} 
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}
