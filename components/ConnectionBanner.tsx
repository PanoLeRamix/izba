import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export const ConnectionBanner = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // NetInfo handles both Web and Native
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View 
      style={{ 
        opacity,
        position: 'absolute',
        top: insets.top + 10,
        left: 20,
        right: 20,
        zIndex: 9999,
      }}
      className="bg-red-500 p-4 rounded-2xl flex-row items-center shadow-lg"
    >
      <WifiOff size={20} color="white" />
      <Text className="text-white font-bold ml-3 flex-1">
        {t('common.noConnection')}
      </Text>
    </Animated.View>
  );
};
