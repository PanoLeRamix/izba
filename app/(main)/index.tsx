import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Copy, Home, User, LogOut, Check } from 'lucide-react-native';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export default function MainIndex() {
  const { logout, houseId, userId } = useAuthStore();
  const { t } = useTranslation();
  
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
        <ActivityIndicator size="large" color="#2D5A27" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-hearth p-6 pt-20">
      <View className="items-center mb-12">
        <Text className="text-4xl mb-2">🌲</Text>
        <Text className="text-3xl font-bold text-forest-dark text-center">{t('main.welcome')}</Text>
      </View>

      {/* House Tile */}
      <View 
        style={{ backgroundColor: '#F4F2EC' }}
        className="p-6 rounded-3xl mb-6 border border-sage/30 shadow-sm"
      >
        <View className="flex-row items-center mb-6">
          <View className="bg-forest/10 p-3 rounded-2xl mr-4">
            <Home size={24} color="#2D5A27" />
          </View>
          <View className="flex-1">
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
          <View>
            <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[1px] mb-0.5">
              {t('main.inviteCode')}
            </Text>
            <Text className="text-lg font-mono font-bold text-forest">{houseCode}</Text>
          </View>
          <View className="bg-white/50 p-2 rounded-xl">
            {copied ? (
              <Check size={18} color="#2D5A27" />
            ) : (
              <Copy size={18} color="#2D5A27" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* User Tile */}
      <View 
        style={{ backgroundColor: '#F4F2EC' }}
        className="p-6 rounded-3xl mb-12 border border-sage/30 shadow-sm flex-row items-center"
      >
        <View className="bg-forest/10 p-3 rounded-2xl mr-4">
          <User size={24} color="#2D5A27" />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-hearth-earth/40 uppercase font-bold tracking-[2px] mb-1">
            {t('main.identity')}
          </Text>
          <Text className="text-2xl font-bold text-forest-dark">
            {userName}
          </Text>
        </View>
      </View>
      
      <View className="mt-auto">
        <Button 
          title={t('main.logout')} 
          onPress={logout} 
          variant="outline"
          icon={<LogOut size={20} color="#2D5A27" />}
        />
      </View>
    </View>
  );
}
