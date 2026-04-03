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
            borderColor: Colors.status.availableBorder,
          }
        : status === 'unavailable'
          ? {
              iconColor: Colors.status.unavailable,
              bgColor: Colors.status.unavailableBg,
              borderColor: Colors.status.unavailableBorder,
            }
          : {
              iconColor: Colors.status.none,
              bgColor: Colors.status.noneBg,
              borderColor: Colors.status.noneBorder,
            };

    const eatersDisplay = eaters
      .map((user) => (user.guestCount && user.guestCount > 0 ? `${user.name} (+${user.guestCount})` : user.name))
      .join(', ');

    return (
      <View
        style={{
          height: tileHeight,
          shadowColor: isToday ? Colors.forestDark : Colors.blackAlpha5,
          shadowOffset: { width: 0, height: isToday ? 6 : 1 },
          shadowOpacity: isToday ? 0.4 : 0.05,
          shadowRadius: isToday ? 8 : 2,
          elevation: isToday ? 8 : 1,
          backgroundColor: statusStyle.bgColor,
          borderColor: isToday ? Colors.forestDark : statusStyle.borderColor,
          borderWidth: isToday ? 3 : 0.5,
        }}
        className="flex-row items-center mb-2 rounded-[32px] overflow-hidden"
      >
        <TouchableOpacity activeOpacity={0.7} onPress={() => onShowDetails(dateKey)} className="flex-row items-center flex-1 h-full px-4">
          <View className={`w-16 h-16 items-center justify-center rounded-2xl bg-white border ${isToday ? 'border-forest/40' : 'border-black/5'}`}>
            <Text className="text-xs font-black text-forest uppercase tracking-widest mb-0.5">{format(date, 'EEE', { locale })}</Text>
            <Text className="text-2xl font-black text-forest-dark leading-none">{format(date, 'd', { locale })}</Text>
          </View>

          <View className="ml-4 flex-1">
            <View className="flex-row items-center h-6">
              <Text className="text-lg mr-2">👩‍🍳</Text>
              <Text className="text-sm font-bold text-forest-dark flex-1" numberOfLines={1} ellipsizeMode="tail">
                {cookName || ''}
              </Text>
            </View>
            <View className="flex-row items-start mt-1">
              <View className="relative mr-2 items-center justify-center w-6 h-6">
                <Text className="text-lg absolute">🍽️</Text>
                {eatersCount > 0 ? (
                  <View className="items-center justify-center mt-0.5">
                    <Text className="text-[8px] text-black font-black leading-none">{eatersCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-sm font-bold text-forest-dark flex-1 leading-tight" numberOfLines={2} ellipsizeMode="tail">
                {eatersDisplay}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={() => onToggleStatus(dateKey)} style={{ backgroundColor: Colors.whiteAlpha50 }} className="w-20 h-full items-center justify-center border-l border-black/5">
          <View className={`w-14 h-14 items-center justify-center rounded-full bg-white border ${isToday ? 'border-forest/30' : 'border-black/5'} shadow-sm`}>
            {isUserCooking ? (
              <ChefHat size={32} color={Colors.chefOrange} strokeWidth={3} />
            ) : status === 'available' ? (
              <Check size={32} color={statusStyle.iconColor} strokeWidth={4} />
            ) : status === 'unavailable' ? (
              <X size={32} color={statusStyle.iconColor} strokeWidth={4} />
            ) : (
              <View className="items-center justify-center w-full h-full">
                <Text style={{ color: statusStyle.iconColor, fontSize: 28, fontWeight: '900', textAlign: 'center', includeFontPadding: false }}>?</Text>
              </View>
            )}

            {userGuestCount > 0 ? (
              <View className="absolute -top-1 -right-1 bg-forest px-1.5 py-0.5 rounded-lg border border-white shadow-sm">
                <Text className="text-[10px] text-white font-black">+{userGuestCount}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);
