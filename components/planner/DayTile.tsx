import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react-native';
import { User } from '../../services/user';

interface DayTileProps {
  date: Date;
  dateKey: string;
  status: string;
  isUserCooking: boolean;
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
  locale: any;
  isToday: boolean;
  tileHeight: number;
  eaters: (User & { guestCount?: number })[];
  eatersCount: number;
  cookName?: string;
}

export const DayTile = memo(({ 
  date, 
  dateKey, 
  status, 
  isUserCooking,
  onPress, 
  onLongPress, 
  locale, 
  isToday: today, 
  tileHeight, 
  eaters,
  eatersCount,
  cookName
}: DayTileProps) => {
  let iconColor = '#92400e'; 
  let bgColor = 'bg-amber-50';
  let borderColor = 'border-amber-200';

  if (status === 'available') {
    iconColor = '#1B3617';
    bgColor = 'bg-[#E9F0E9]';
    borderColor = 'border-forest/20';
  } else if (status === 'unavailable') {
    iconColor = '#991b1b';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
  }

  const eatersDisplay = eaters.map((u) => {
    if (u.guestCount && u.guestCount > 0) {
      return `${u.name} (+${u.guestCount})`;
    }
    return u.name;
  }).join(', ');

  return (
    <TouchableOpacity
      onPress={() => onPress(dateKey)}
      onLongPress={() => onLongPress(dateKey)}
      activeOpacity={0.7}
      style={{ 
        height: tileHeight,
        shadowColor: today ? '#1B3617' : '#000',
        shadowOffset: { width: 0, height: today ? 6 : 1 },
        shadowOpacity: today ? 0.4 : 0.05,
        shadowRadius: today ? 8 : 2,
        elevation: today ? 8 : 1,
      }}
      className={`flex-row items-center justify-between p-4 mb-2 rounded-[32px] ${bgColor} ${today ? 'border-[3px] border-forest-dark' : `border-[0.5px] ${borderColor}`}`}
    >
      <View className="flex-row items-center flex-1">
        <TouchableOpacity 
          activeOpacity={0.6}
          onPress={() => onLongPress(dateKey)}
          className={`w-16 h-16 items-center justify-center rounded-2xl bg-white border ${today ? 'border-forest/40' : 'border-black/5'}`}
        >
          <Text className="text-xs font-black text-forest uppercase tracking-widest mb-0.5">{format(date, 'EEE', { locale })}</Text>
          <Text className="text-2xl font-black text-forest-dark leading-none">{format(date, 'd', { locale })}</Text>
        </TouchableOpacity>
        
        <View className="ml-4 flex-1">
          <View className="flex-row items-center h-6">
            <Text className="text-lg mr-2">🧑‍🍳</Text>
            <Text className="text-sm font-bold text-forest-dark flex-1" numberOfLines={1} ellipsizeMode="tail">
              {cookName || ''}
            </Text>
          </View>
          <View className="flex-row items-center h-6">
            <View className="relative mr-2 items-center justify-center w-6 h-6">
              <Text className="text-lg absolute">🍽️</Text>
              {eatersCount > 0 && (
                <View className="items-center justify-center mt-0.5">
                  <Text className="text-[8px] text-black font-black leading-none">{eatersCount}</Text>
                </View>
              )}
            </View>
            <Text className="text-sm font-bold text-forest-dark flex-1" numberOfLines={1} ellipsizeMode="tail">
              {eatersDisplay}
            </Text>
          </View>
        </View>
      </View>
      
      <View className={`w-14 h-14 items-center justify-center rounded-full bg-white border ${today ? 'border-forest/30' : 'border-black/5'}`}>
        {isUserCooking ? (
          <View className="items-center justify-center w-full h-full">
            <Text style={{ 
              fontSize: 28, 
              includeFontPadding: false,
              textAlignVertical: 'center',
              lineHeight: Platform.OS === 'ios' ? 34 : undefined,
            }}>🧑‍🍳</Text>
          </View>
        ) : (
          status === 'available' ? <Check size={32} color={iconColor} strokeWidth={4} /> : 
          status === 'unavailable' ? <X size={32} color={iconColor} strokeWidth={4} /> : 
          <View className="items-center justify-center w-full h-full">
            <Text style={{ color: iconColor, fontSize: 28, fontWeight: '900', textAlign: 'center', includeFontPadding: false }}>?</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});
