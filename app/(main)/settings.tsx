import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Copy, Home, User, LogOut, Check } from 'lucide-react-native';
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

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, [houseId, userId]);

  const copyToClipboard = async () => {
    await copy(houseCode);
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
            <Text className="text-2xl font-bold text-forest-dark">
              {houseName}
            </Text>
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
          <Text className="text-2xl font-bold text-forest-dark">
            {userName}
          </Text>
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
    </ScrollView>
  );
}
