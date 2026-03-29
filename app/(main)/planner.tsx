import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays, addWeeks, isToday, isSameMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { plannerService, PlannerStatus, MealPlan } from '../../services/planner';
import { userService, User } from '../../services/user';
import { DayTile } from '../../components/planner/DayTile';
import { DetailModal } from '../../components/planner/DetailModal';

type DayStatus = PlannerStatus;

interface UserDayPlan {
  status: DayStatus;
  isCooking: boolean;
  guestCount: number;
  note: string;
}

const STATUS_CYCLE: DayStatus[] = ['none', 'available', 'unavailable'];
const INITIAL_WEEK_INDEX = 5;
const DEBOUNCE_DELAY = 1000;

const WeekPage = React.memo(({ item, windowWidth, plans, onToggleStatus, onLongPress, locale, tileHeight, processedData }: any) => (
  <View style={{ width: windowWidth }} className="px-6">
    {item.days.map((day: any) => {
      const dayPlan = plans[day.dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const { eaters, totalCount, cooks } = processedData[day.dateKey] || { eaters: [], totalCount: 0, cooks: [] };

      return (
        <DayTile 
          key={day.dateKey} 
          {...day} 
          status={dayPlan.status} 
          isUserCooking={dayPlan.isCooking}
          onPress={onToggleStatus} 
          onLongPress={onLongPress}
          locale={locale} 
          isToday={isToday(day.date)} 
          tileHeight={tileHeight} 
          eaters={eaters}
          eatersCount={totalCount}
          cookName={cooks.map((u: User) => u.name).join(', ')}
        />
      );
    })}
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
  
  const [plans, setPlans] = useState<Record<string, UserDayPlan>>({});
  const [currentIndex, setCurrentIndex] = useState(INITIAL_WEEK_INDEX);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
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

  const { isLoading, isError, refetch } = useQuery({
    queryKey: ['planner-init', houseId, userId],
    queryFn: async () => {
      const data = await plannerService.getMealPlans(houseId!, weeks[0].days[0].dateKey, weeks[19].days[6].dateKey);
      const map: Record<string, UserDayPlan> = {};
      data.filter(p => p.user_id === userId).forEach(p => {
        map[p.day_date] = { status: p.status, isCooking: p.is_cooking, guestCount: p.guest_count || 0, note: p.note || '' };
      });
      setPlans(map);
      return data;
    },
    enabled: !!houseId && !!userId,
    staleTime: Infinity,
    retry: 1,
  });

  const { data: allMealPlans = [] } = useQuery({
    queryKey: ['house-plans', houseId],
    queryFn: () => plannerService.getMealPlans(houseId!, weeks[0].days[0].dateKey, weeks[19].days[6].dateKey),
    enabled: !!houseId,
    staleTime: Infinity,
  });

  const processedData = useMemo(() => {
    const map: Record<string, { eaters: (User & { guestCount: number, note?: string })[], totalCount: number, cooks: User[] }> = {};
    
    allMealPlans.forEach(p => {
      if (p.user_id === userId) return;
      if (!map[p.day_date]) map[p.day_date] = { eaters: [], totalCount: 0, cooks: [] };
      
      const user = users.find(u => u.id === p.user_id);
      if (!user) return;

      if (p.status === 'available') {
        const guests = p.guest_count || 0;
        map[p.day_date].eaters.push({ ...user, guestCount: guests, note: p.note });
        map[p.day_date].totalCount += 1 + guests;
      }
      
      if (p.is_cooking) {
        map[p.day_date].cooks.push(user);
      }
    });

    Object.entries(plans).forEach(([dateKey, plan]) => {
      if (!map[dateKey]) map[dateKey] = { eaters: [], totalCount: 0, cooks: [] };
      const me = users.find(u => u.id === userId);
      if (!me) return;

      if (plan.status === 'available') {
        map[dateKey].eaters.push({ ...me, guestCount: plan.guestCount, note: plan.note });
        map[dateKey].totalCount += 1 + plan.guestCount;
      }
      
      if (plan.isCooking) {
        map[dateKey].cooks.push(me);
      }
    });

    return map;
  }, [allMealPlans, users, plans, userId]);

  const mutation = useMutation({
    mutationFn: plannerService.upsertMealPlan,
    onSuccess: (newPlan) => {
      queryClient.setQueryData(['house-plans', houseId], (old: MealPlan[] | undefined) => {
        if (!old) return [newPlan];
        const index = old.findIndex(p => p.user_id === newPlan.user_id && p.day_date === newPlan.day_date);
        if (index > -1) {
          const updated = [...old];
          updated[index] = newPlan;
          return updated;
        }
        return [...old, newPlan];
      });
    }
  });

  const updateRemotePlan = useCallback((dateKey: string, status: DayStatus, isCooking: boolean, guestCount: number, note: string) => {
    if (debounceTimers.current[dateKey]) clearTimeout(debounceTimers.current[dateKey]);
    debounceTimers.current[dateKey] = setTimeout(() => {
      mutation.mutate({ 
        user_id: userId!, 
        house_id: houseId!, 
        day_date: dateKey, 
        status,
        is_cooking: isCooking,
        guest_count: guestCount,
        note
      });
      delete debounceTimers.current[dateKey];
    }, DEBOUNCE_DELAY);
  }, [userId, houseId, mutation]);

  const toggleStatus = useCallback((dateKey: string) => {
    setPlans(prev => {
      const currentPlan = prev[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentPlan.status) + 1) % 3];
      const nextIsCooking = false;
      const nextGuestCount = 0;
      const nextNote = ''; // Personal notes are cleared when cycling status? User said "everything change" for cooking, maybe keep note? 
      // Re-reading: "if i cycle on that tile, the 'i'm cooking' gets automatically removed"
      // Let's clear the note too if cycling to keep it simple and clean.
      
      const nextPlan = { status: nextStatus, isCooking: nextIsCooking, guestCount: nextGuestCount, note: nextNote };
      updateRemotePlan(dateKey, nextStatus, nextIsCooking, nextGuestCount, nextNote);
      return { ...prev, [dateKey]: nextPlan };
    });
  }, [updateRemotePlan]);

  const toggleCooking = useCallback((dateKey: string) => {
    setPlans(prev => {
      const currentPlan = prev[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextIsCooking = !currentPlan.isCooking;
      const nextStatus = nextIsCooking ? 'available' : currentPlan.status;
      const nextPlan = { ...currentPlan, status: nextStatus, isCooking: nextIsCooking };
      updateRemotePlan(dateKey, nextStatus, nextIsCooking, currentPlan.guestCount, currentPlan.note);
      return { ...prev, [dateKey]: nextPlan };
    });
  }, [updateRemotePlan]);

  const setGuestCount = useCallback((dateKey: string, count: number) => {
    setPlans(prev => {
      const currentPlan = prev[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextStatus = count > 0 ? 'available' : currentPlan.status;
      const nextPlan = { ...currentPlan, status: nextStatus, guestCount: count };
      updateRemotePlan(dateKey, nextStatus, currentPlan.isCooking, count, currentPlan.note);
      return { ...prev, [dateKey]: nextPlan };
    });
  }, [updateRemotePlan]);

  const updateNote = useCallback((dateKey: string, note: string) => {
    setPlans(prev => {
      const currentPlan = prev[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextPlan = { ...currentPlan, note };
      updateRemotePlan(dateKey, currentPlan.status, currentPlan.isCooking, currentPlan.guestCount, note);
      return { ...prev, [dateKey]: nextPlan };
    });
  }, [updateRemotePlan]);

  const openDetails = useCallback((dateKey: string) => {
    setSelectedDayKey(dateKey);
  }, []);

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

  const dayData = selectedDayKey ? processedData[selectedDayKey] : null;
  const selectedDayEaters = dayData?.eaters || [];
  const selectedDayCooks = dayData?.cooks || [];
  const selectedDayDate = selectedDayKey ? new Date(selectedDayKey) : null;
  const selectedDayPlan = selectedDayKey ? (plans[selectedDayKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' }) : { status: 'none', isCooking: false, guestCount: 0, note: '' };

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
        renderItem={({ item }) => (
          <WeekPage 
            item={item} 
            windowWidth={windowWidth} 
            plans={plans} 
            onToggleStatus={toggleStatus} 
            onLongPress={openDetails} 
            locale={locale} 
            tileHeight={tileHeight} 
            processedData={processedData}
          />
        )}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        initialScrollIndex={INITIAL_WEEK_INDEX}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / windowWidth))}
        getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
        removeClippedSubviews={true}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={2}
      />

      <DetailModal
        visible={!!selectedDayKey}
        onClose={() => setSelectedDayKey(null)}
        date={selectedDayDate}
        dateKey={selectedDayKey || ''}
        eaters={selectedDayEaters}
        cooks={selectedDayCooks}
        isUserCooking={selectedDayPlan.isCooking}
        guestCount={selectedDayPlan.guestCount}
        note={selectedDayPlan.note}
        onToggleCooking={toggleCooking}
        onSetGuestCount={setGuestCount}
        onUpdateNote={updateNote}
        locale={locale}
      />
    </View>
  );
}
