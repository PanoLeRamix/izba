import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays, addWeeks, isToday, isSameMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Check, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { plannerService, PlannerStatus, MealPlan } from '../../services/planner';
import { userService, User } from '../../services/user';

type DayStatus = PlannerStatus;

interface DayData {
  date: Date;
  dateKey: string;
}

interface WeekData {
  id: string;
  days: DayData[];
  startDate: Date;
}

const STATUS_CYCLE: DayStatus[] = ['none', 'available', 'unavailable'];
const INITIAL_WEEK_INDEX = 5;
const DEBOUNCE_DELAY = 1000;

const DayTile = memo(({ date, dateKey, status, onPress, locale, isToday: today, tileHeight, eaters }: any) => {
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

  // Join all eaters' names to show as many as possible
  const eatersDisplay = eaters.map((u: User) => u.name).join(', ');

  return (
    <TouchableOpacity
      onPress={() => onPress(dateKey)}
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
        <View className={`w-16 h-16 items-center justify-center rounded-2xl bg-white border ${today ? 'border-forest/40' : 'border-black/5'}`}>
          <Text className="text-xs font-black text-forest uppercase tracking-widest mb-0.5">{format(date, 'EEE', { locale })}</Text>
          <Text className="text-2xl font-black text-forest-dark leading-none">{format(date, 'd', { locale })}</Text>
        </View>
        
        <View className="ml-4 flex-1">
          <View className="flex-row items-center h-6">
            <Text className="text-lg mr-2">👨‍🍳</Text>
            <Text className="text-sm font-medium text-forest-dark/40 italic"></Text>
          </View>
          <View className="flex-row items-center h-6 overflow-hidden">
            <Text className="text-lg mr-2">🍽️</Text>
            <Text className="text-sm font-bold text-forest-dark flex-1" numberOfLines={1} ellipsizeMode="tail">
              {eatersDisplay}
            </Text>
          </View>
        </View>
      </View>
      
      <View className={`w-14 h-14 items-center justify-center rounded-full bg-white border ${today ? 'border-forest/30' : 'border-black/5'}`}>
        {status === 'available' ? <Check size={32} color={iconColor} strokeWidth={4} /> : 
         status === 'unavailable' ? <X size={32} color={iconColor} strokeWidth={4} /> : 
         <Text style={{ color: iconColor, fontSize: 32, fontWeight: '900' }}>?</Text>}
      </View>
    </TouchableOpacity>
  );
});

const WeekPage = memo(({ item, windowWidth, plans, onToggleStatus, locale, tileHeight, eatersByDay }: any) => (
  <View style={{ width: windowWidth }} className="px-6">
    {item.days.map((day: any) => (
      <DayTile 
        key={day.dateKey} 
        {...day} 
        status={plans[day.dateKey] || 'none'} 
        onPress={onToggleStatus} 
        locale={locale} 
        isToday={isToday(day.date)} 
        tileHeight={tileHeight} 
        eaters={eatersByDay[day.dateKey] || []}
      />
    ))}
  </View>
));

export default function Planner() {
  const { t, i18n } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const { userId, houseId } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  
  const [plans, setPlans] = useState<Record<string, DayStatus>>({});
  const [currentIndex, setCurrentIndex] = useState(INITIAL_WEEK_INDEX);
  const debounceTimers = useRef<Record<string, any>>({});
  const errorShown = useRef(false);

  const weeks = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 20 }, (_, i) => {
      const weekStart = addWeeks(start, i - 5);
      return {
        id: `week-${i - 5}`,
        startDate: weekStart,
        days: Array.from({ length: 7 }, (_, j) => {
          const d = addDays(weekStart, j);
          return { date: d, dateKey: format(d, 'yyyy-MM-dd') };
        })
      };
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['house-users', houseId],
    queryFn: () => userService.getHouseUsers(houseId!),
    enabled: !!houseId,
  });

  const { data: allMealPlans = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['planner-init', houseId, userId],
    queryFn: async () => {
      const data = await plannerService.getMealPlans(houseId!, weeks[0].days[0].dateKey, weeks[19].days[6].dateKey);
      const map: Record<string, DayStatus> = {};
      data.filter(p => p.user_id === userId).forEach(p => map[p.day_date] = p.status);
      setPlans(map);
      return data;
    },
    enabled: !!houseId && !!userId,
    staleTime: Infinity,
    retry: 1,
  });

  const eatersByDay = useMemo(() => {
    const map: Record<string, User[]> = {};
    allMealPlans.forEach(p => {
      if (p.status === 'available') {
        if (!map[p.day_date]) map[p.day_date] = [];
        const user = users.find(u => u.id === p.user_id);
        if (user) map[p.day_date].push(user);
      }
    });
    return map;
  }, [allMealPlans, users]);

  const mutation = useMutation({
    mutationFn: plannerService.upsertMealPlan,
    onSuccess: (newPlan) => {
      // Update local cache of allMealPlans to reflect the change immediately for others
      queryClient.setQueryData(['planner-init', houseId, userId], (old: MealPlan[] | undefined) => {
        if (!old) return [newPlan];
        const index = old.findIndex(p => p.user_id === newPlan.user_id && p.day_date === newPlan.day_date);
        if (index > -1) {
          const updated = [...old];
          updated[index] = newPlan;
          return updated;
        }
        return [...old, newPlan];
      });
    },
    onError: () => {
      if (!errorShown.current) {
        Alert.alert(
          t('common.error'), 
          t('planner.syncError'), 
          [{ text: t('common.refresh'), onPress: () => {
            errorShown.current = false;
            refetch();
          }}]
        );
        errorShown.current = true;
      }
    }
  });

  const toggleStatus = useCallback((dateKey: string) => {
    setPlans(prev => {
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(prev[dateKey] || 'none') + 1) % 3];
      const nextPlans = { ...prev, [dateKey]: nextStatus };

      if (debounceTimers.current[dateKey]) clearTimeout(debounceTimers.current[dateKey]);
      debounceTimers.current[dateKey] = setTimeout(() => {
        mutation.mutate({ user_id: userId!, house_id: houseId!, day_date: dateKey, status: nextStatus });
        delete debounceTimers.current[dateKey];
      }, DEBOUNCE_DELAY);

      return nextPlans;
    });
  }, [userId, houseId, mutation]);

  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 16);
  const headerHeight = 70;
  const tabBarHeight = 60 + (insets.bottom > 0 ? insets.bottom / 2 : 0);
  const bottomBuffer = insets.bottom > 0 ? insets.bottom : 16;
  const availableHeight = windowHeight - topPadding - headerHeight - tabBarHeight - bottomBuffer;
  const tileHeight = Math.floor((availableHeight - 60) / 7);

  const currentWeekLabel = useMemo(() => {
    const s = weeks[currentIndex].startDate;
    const e = addDays(s, 6);
    return isSameMonth(s, e) ? format(s, 'MMMM yyyy', { locale }) : `${format(s, 'MMM.', { locale })} / ${format(e, 'MMM.', { locale })} ${format(e, 'yyyy', { locale })}`;
  }, [currentIndex, locale, weeks]);

  if (isLoading) return <View className="flex-1 bg-hearth items-center justify-center"><ActivityIndicator size="large" color="#2D5A27" /></View>;

  if (isError) {
    return (
      <View className="flex-1 bg-hearth items-center justify-center p-6">
        <AlertCircle size={48} color="#991b1b" />
        <Text className="text-xl font-bold text-forest-dark mt-4 text-center">{t('common.error')}</Text>
        <Text className="text-forest-light text-center mt-2 mb-8">{t('planner.loadError')}</Text>
        <TouchableOpacity 
          onPress={() => refetch()}
          className="bg-forest px-8 py-4 rounded-2xl shadow-sm"
        >
          <Text className="text-white font-black uppercase tracking-widest">{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      <View className="px-6 mb-4 flex-row items-center justify-between h-[60px]">
        <View className="flex-1 mr-4">
          <Text className="text-3xl font-black text-forest-dark uppercase">{t('tabs.planner')}</Text>
          <Text className="text-xs font-bold text-forest-light uppercase opacity-60">{currentWeekLabel}</Text>
        </View>
        <View className="flex-row items-center bg-white shadow-sm p-1 rounded-2xl border border-sage-light/30">
          <TouchableOpacity onPress={() => flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })} className="p-2"><ChevronLeft size={24} color="#2D5A27" /></TouchableOpacity>
          <TouchableOpacity onPress={() => flatListRef.current?.scrollToIndex({ index: INITIAL_WEEK_INDEX, animated: true })} className={`px-4 py-2 rounded-xl border ${currentIndex === INITIAL_WEEK_INDEX ? 'bg-forest border-forest' : 'bg-hearth border-sage-light/20'}`}><Text className={`text-xs font-black uppercase ${currentIndex === INITIAL_WEEK_INDEX ? 'text-white' : 'text-forest'}`}>{t('common.today')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })} className="p-2"><ChevronRight size={24} color="#2D5A27" /></TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={weeks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <WeekPage item={item} windowWidth={windowWidth} plans={plans} onToggleStatus={toggleStatus} locale={locale} tileHeight={tileHeight} eatersByDay={eatersByDay} />}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        initialScrollIndex={INITIAL_WEEK_INDEX}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / windowWidth))}
        getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
        removeClippedSubviews={true}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={2}
      />
    </View>
  );
}
