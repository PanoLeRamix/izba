import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import * as Clipboard from 'expo-clipboard';
import { Copy, Home, User, LogOut, Check } from 'lucide-react-native';

export default function MainIndex() {
  const { logout, houseId, userId } = useAuthStore();
  const { t } = useTranslation();
  
  const [houseName, setHouseName] = useState('');
  const [houseCode, setHouseCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    await Clipboard.setStringAsync(houseCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <View className="bg-white/60 p-6 rounded-3xl mb-6 border border-sage/20 shadow-sm">
        <View className="flex-row items-center mb-4">
          <View className="bg-forest/10 p-3 rounded-2xl mr-3">
            <Home size={24} color="#2D5A27" />
          </View>
          <View>
            <Text className="text-xs text-hearth-earth/50 uppercase font-bold tracking-wider">{t('main.house')}</Text>
            <Text className="text-xl font-bold text-forest-dark">{houseName}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={copyToClipboard}
          className="bg-sage-light/30 p-4 rounded-2xl flex-row items-center justify-between border border-sage/30"
        >
          <View>
            <Text className="text-xs text-hearth-earth/50 uppercase font-bold tracking-wider">{t('main.inviteCode')}</Text>
            <Text className="text-lg font-mono font-bold text-forest">{houseCode}</Text>
          </View>
          {copied ? (
            <Check size={20} color="#2D5A27" />
          ) : (
            <Copy size={20} color="#2D5A27" />
          )}
        </TouchableOpacity>
      </View>

      <View className="bg-white/60 p-6 rounded-3xl mb-12 border border-sage/20 shadow-sm">
        <View className="flex-row items-center">
          <View className="bg-forest/10 p-3 rounded-2xl mr-3">
            <User size={24} color="#2D5A27" />
          </View>
          <View>
            <Text className="text-xs text-hearth-earth/50 uppercase font-bold tracking-wider">{t('main.identity')}</Text>
            <Text className="text-xl font-bold text-forest-dark">{userName}</Text>
          </View>
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
