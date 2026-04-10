import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { format, type Locale } from 'date-fns';
import { Check, ChefHat, X } from 'lucide-react-native';
import { type PlannerStatus } from '../../services/planner';
import { type User } from '../../services/user';
import { Colors } from '../../constants/Colors';

interface DayTileProps {
  date: Date;
  dateKey: string;
  status: PlannerStatus;
  isUserCooking: boolean;
  userGuestCount?: number;
  onToggleStatus: (dateKey: string) => void;
  onShowDetails: (dateKey: string) => void;
  locale: Locale;
  isToday: boolean;
  tileHeight: number;
  eaters: Array<User & { guestCount?: number }>;
  eatersCount: number;
  cookName?: string;
}

export const DayTile = memo(
  ({ date, dateKey, status, isUserCooking, userGuestCount = 0, onToggleStatus, onShowDetails, locale, isToday, tileHeight, eaters, eatersCount, cookName }: DayTileProps) => {
    const statusStyle =
      status === 'available'
        ? {
            iconColor: Colors.status.available,
            bgColor: Colors.status.availableBg,
          }
        : status === 'unavailable'
          ? {
              iconColor: Colors.status.unavailable,
              bgColor: Colors.status.unavailableBg,
            }
          : {
              iconColor: Colors.status.none,
              bgColor: Colors.status.noneBg,
            };

    const eatersDisplay = eaters
      .map((user) => (user.guestCount && user.guestCount > 0 ? `${user.name} (+${user.guestCount})` : user.name))
      .join(', ');

    return (
      <View
        style={{
          height: tileHeight,
          shadowColor: isToday ? Colors.primary : Colors.onSurface,
          shadowOffset: { width: 0, height: isToday ? 8 : 1 },
          shadowOpacity: isToday ? 0.2 : 0.05,
          shadowRadius: isToday ? 12 : 2,
          elevation: isToday ? 8 : 1,
          backgroundColor: statusStyle.bgColor,
          borderColor: isToday ? Colors.primary : Colors.outlineVariant,
          borderWidth: isToday ? 2.5 : 0,
        }}
        className="flex-row items-center mb-2 rounded-[32px] overflow-hidden"
      >
        <TouchableOpacity activeOpacity={0.7} onPress={() => onShowDetails(dateKey)} className="flex-row items-center flex-1 h-full px-4">
          <View className={`w-16 h-16 items-center justify-center rounded-2xl bg-surface-container-lowest border ${isToday ? 'border-primary/20' : 'border-outline-variant/10'}`}>
            <Text className="text-[10px] font-black text-primary uppercase tracking-[1.5px] mb-0.5">{format(date, 'EEE', { locale })}</Text>
            <Text className="text-2xl font-black text-primary leading-none">{format(date, 'd', { locale })}</Text>
          </View>

          <View className="ml-4 flex-1 py-1">
            {/* Cook line */}
            <View className="flex-row items-center">
              <View className="w-8 items-center justify-center mr-1">
                <Text className="text-base">👩‍🍳</Text>
              </View>
              <Text className="text-sm font-bold text-primary flex-1" numberOfLines={1} ellipsizeMode="tail">
                {cookName || ''}
              </Text>
            </View>
            
            {/* Spacing instead of line */}
            <View className="h-2" />

            {/* Eating line */}
            <View className="flex-row items-center">
              <View className="w-8 items-center justify-center mr-1">
                <View className="relative items-center justify-center w-6 h-6">
                  <Text className="text-lg absolute">🍽️</Text>
                  <View className="items-center justify-center mt-1">
                    <Text className="text-[10px] text-primary font-black leading-none">{eatersCount}</Text>
                  </View>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary flex-1 leading-tight" numberOfLines={2} ellipsizeMode="tail">
                {eatersDisplay}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => onToggleStatus(dateKey)} 
          style={{ backgroundColor: Colors.whiteAlpha50 }} 
          className="w-20 h-full items-center justify-center border-l border-outline-variant/10"
        >
          <View className={`w-14 h-14 items-center justify-center rounded-full bg-surface-container-lowest border ${isToday ? 'border-primary/20' : 'border-outline-variant/10'} shadow-sm`}>
            {isUserCooking ? (
              <ChefHat size={28} color={Colors.tertiary} strokeWidth={2.5} />
            ) : status === 'available' ? (
              <Check size={28} color={statusStyle.iconColor} strokeWidth={3} />
            ) : status === 'unavailable' ? (
              <X size={28} color={statusStyle.iconColor} strokeWidth={3} />
            ) : (
              <Text style={{ color: statusStyle.iconColor, fontSize: 24, fontWeight: '900' }}>?</Text>
            )}

            {userGuestCount > 0 ? (
              <View className="absolute -top-1 -right-1 bg-primary px-1.5 py-0.5 rounded-lg border border-surface-container-lowest shadow-sm">
                <Text className="text-[10px] text-on-primary font-black">+{userGuestCount}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);
