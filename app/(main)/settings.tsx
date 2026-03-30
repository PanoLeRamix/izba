import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Copy, Home, User, LogOut, Check, Pencil } from 'lucide-react-native';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';

export default function MainIndex() {
  const { logout, houseId, userId } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [houseName, setHouseName] = useState('');
  const [houseCode, setHouseCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const { copied, copy } = useCopyToClipboard();

  // Editing state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<'house' | 'user' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const fetchData = useCallback(async () => {
    if (!houseId || !userId) return;
    
    try {
      const [houseRes, userRes] = await Promise.all([
        supabase.from('houses').select('name, code').eq('id', houseId).single(),
        supabase.from('users').select('name').eq('id', userId).single()
      ]);

      if (houseRes.data) {
        setHouseName(houseRes.data.name);
        setHouseCode(houseRes.data.code);
      }
      if (userRes.data) {
        setUserName(userRes.data.name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [houseId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Web-specific visual viewport tracking to handle mobile keyboards
  useEffect(() => {
    if (Platform.OS !== 'web' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // If viewport height is significantly less than window height, keyboard is likely up
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

  // Focus input when modal opens
  useEffect(() => {
    if (editModalVisible) {
      // Small timeout to ensure modal is rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalVisible]);

  const copyToClipboard = async () => {
    await copy(houseCode);
  };

  const openEditModal = (target: 'house' | 'user') => {
    setEditTarget(target);
    setEditValue(target === 'house' ? houseName : userName);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editValue.trim()) return;
    
    setSaving(true);
    try {
      if (editTarget === 'house') {
        const { error } = await supabase
          .from('houses')
          .update({ name: editValue.trim() })
          .eq('id', houseId);
        
        if (error) {
          console.error('Update house error:', error);
          throw error;
        }
        setHouseName(editValue.trim());
      } else {
        const { error } = await supabase
          .from('users')
          .update({ name: editValue.trim() })
          .eq('id', userId);
        
        if (error) {
          console.error('Update user error:', error);
          throw error;
        }
        setUserName(editValue.trim());
      }
      setEditModalVisible(false);
    } catch (e: any) {
      console.error('Save failed:', e);
      Alert.alert(t('common.error'), e.message || t('common.error'));
    } finally {
      setSaving(false);
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

      {/* House Tile */}
      <View 
        style={{ backgroundColor: Colors.tileBackground }}
        className="p-6 rounded-3xl mb-6 border border-sage/30 shadow-sm overflow-hidden"
      >
        <View className="flex-row items-center mb-6 bg-transparent">
          <View className="bg-forest/10 p-3 rounded-2xl mr-4">
            <Home size={24} color={Colors.forest} />
          </View>
          <View className="flex-1 bg-transparent">
            <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">
              {t('main.house')}
            </Text>
            <View className="flex-row items-center bg-transparent">
              <Text className="text-2xl font-bold text-forest-dark flex-1">
                {houseName}
              </Text>
              <TouchableOpacity onPress={() => openEditModal('house')} className="p-2 ml-2 bg-white/50 rounded-xl">
                <Pencil size={16} color={Colors.forest} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={copyToClipboard}
          className="bg-forest/5 p-4 rounded-2xl flex-row items-center justify-between border border-forest/10"
          activeOpacity={0.6}
        >
          <View className="flex-1 bg-transparent">
            <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[1px] mb-0.5">
              {t('main.inviteCode')}
            </Text>
            <Text className="text-lg font-mono font-bold text-forest">{houseCode}</Text>
          </View>
          <View className="bg-white/50 p-2 rounded-xl">
            {copied ? (
              <Check size={18} color={Colors.forest} />
            ) : (
              <Copy size={18} color={Colors.forest} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* User Tile */}
      <View 
        style={{ backgroundColor: Colors.tileBackground }}
        className="p-6 rounded-3xl mb-6 border border-sage/30 shadow-sm flex-row items-center overflow-hidden"
      >
        <View className="bg-forest/10 p-3 rounded-2xl mr-4">
          <User size={24} color={Colors.forest} />
        </View>
        <View className="flex-1 bg-transparent">
          <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">
            {t('main.identity')}
          </Text>
          <View className="flex-row items-center bg-transparent">
            <Text className="text-2xl font-bold text-forest-dark flex-1">
              {userName}
            </Text>
            <TouchableOpacity onPress={() => openEditModal('user')} className="p-2 ml-2 bg-white/50 rounded-xl">
              <Pencil size={16} color={Colors.forest} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Language Selection Tile */}
      <LanguageToggle variant="tile" />
      
      <View className="mt-8">
        <Button 
          title={t('main.logout')} 
          onPress={logout} 
          variant="outline"
          icon={<LogOut size={20} color={Colors.forest} />}
        />
      </View>

      {/* Edit Modal */}
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
                  loading={saving}
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
