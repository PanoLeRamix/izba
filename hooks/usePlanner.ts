import { useMemo, useCallback, useRef } from 'react';
import { startOfWeek, addWeeks, addDays, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService, MealPlan, PlannerStatus } from '../services/planner';
import { userService, User } from '../services/user';
import { useAuthStore } from '../store/authStore';

const STATUS_CYCLE: PlannerStatus[] = ['none', 'available', 'unavailable'];
const PLANNER_WEEK_COUNT = 20;
export const CURRENT_WEEK_INDEX = 5;

export interface DayInfo {
  date: Date;
  dateKey: string;
}

export interface WeekItem {
  id: string;
  startDate: Date;
  days: DayInfo[];
}

export function usePlanner() {
  const { userId, houseId } = useAuthStore();
  const queryClient = useQueryClient();

  const weeks = useMemo(() => {
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: PLANNER_WEEK_COUNT }, (_, i) => {
      const weekStart = addWeeks(startOfCurrentWeek, i - CURRENT_WEEK_INDEX);
      return {
        id: `week-${i - CURRENT_WEEK_INDEX}`,
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

  const { data: allMealPlans = [], isLoading } = useQuery({
    queryKey: ['house-plans', houseId],
    queryFn: () => {
      const firstDay = weeks[0].days[0].dateKey;
      const lastDay = weeks[PLANNER_WEEK_COUNT - 1].days[6].dateKey;
      return plannerService.getMealPlans(houseId!, firstDay, lastDay);
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5,
  });

  const prevUserPlans = useRef<Record<string, any>>({});
  const userPlans = useMemo(() => {
    const map: Record<string, { status: PlannerStatus; isCooking: boolean; guestCount: number; note: string }> = {};
    allMealPlans.filter(p => p.user_id === userId).forEach(p => {
      const plan = { 
        status: p.status as PlannerStatus, 
        isCooking: p.is_cooking, 
        guestCount: p.guest_count || 0, 
        note: p.note || '' 
      };
      
      const prevPlan = prevUserPlans.current[p.day_date];
      if (prevPlan && JSON.stringify(prevPlan) === JSON.stringify(plan)) {
        map[p.day_date] = prevPlan;
      } else {
        map[p.day_date] = plan;
      }
    });
    prevUserPlans.current = map;
    return map;
  }, [allMealPlans, userId]);

  // Use a ref to store the previous processedData to preserve references
  const prevProcessedData = useRef<Record<string, any>>({});

  const processedData = useMemo(() => {
    const newMap: Record<string, { eaters: (User & { guestCount: number, note?: string })[], unavailable: User[], totalCount: number, cooks: User[] }> = {};
    
    // Create a map for faster user lookups
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);

    // Group plans by date first
    const plansByDate: Record<string, MealPlan[]> = {};
    allMealPlans.forEach(p => {
      if (!plansByDate[p.day_date]) plansByDate[p.day_date] = [];
      plansByDate[p.day_date].push(p);
    });

    Object.keys(plansByDate).forEach(dateKey => {
      const dayPlans = plansByDate[dateKey];
      const eaters: (User & { guestCount: number, note?: string })[] = [];
      const unavailable: User[] = [];
      let totalCount = 0;
      const cooks: User[] = [];

      dayPlans.forEach(p => {
        const user = userMap[p.user_id];
        if (!user) return;

        if (p.status === 'available') {
          const guests = p.guest_count || 0;
          eaters.push({ ...user, guestCount: guests, note: p.note || undefined });
          totalCount += 1 + guests;
        } else if (p.status === 'unavailable') {
          unavailable.push(user);
        }
        
        if (p.is_cooking) {
          cooks.push(user);
        }
      });

      const sortFn = (a: User, b: User) => {
        if (a.id === userId) return -1;
        if (b.id === userId) return 1;
        return a.name.localeCompare(b.name);
      };
      eaters.sort(sortFn);
      unavailable.sort(sortFn);
      cooks.sort(sortFn);

      const dayData = { eaters, unavailable, totalCount, cooks };
      
      // Deep compare with previous data to preserve reference if unchanged
      // This is crucial for WeekPage's memoization
      const prevDayData = prevProcessedData.current[dateKey];
      if (prevDayData && JSON.stringify(prevDayData) === JSON.stringify(dayData)) {
        newMap[dateKey] = prevDayData;
      } else {
        newMap[dateKey] = dayData;
      }
    });

    prevProcessedData.current = newMap;
    return newMap;
  }, [allMealPlans, users, userId]);

  const mutation = useMutation({
    mutationFn: plannerService.upsertMealPlan,
    onMutate: async (newPlan) => {
      await queryClient.cancelQueries({ queryKey: ['house-plans', houseId] });
      const previousPlans = queryClient.getQueryData<MealPlan[]>(['house-plans', houseId]);

      queryClient.setQueryData(['house-plans', houseId], (old: MealPlan[] | undefined) => {
        const filtered = (old || []).filter(p => !(p.user_id === newPlan.user_id && p.day_date === newPlan.day_date));
        // Ensure newPlan has the right snake_case properties for the cache
        const optimisticPlan = {
          ...newPlan,
          id: 'temp-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [...filtered, optimisticPlan as MealPlan];
      });

      return { previousPlans };
    },
    onError: (err, newPlan, context) => {
      queryClient.setQueryData(['house-plans', houseId], context?.previousPlans);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['house-plans', houseId] });
    },
  });

  const toggleStatus = useCallback((dateKey: string) => {
    const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current.status) + 1) % 3];
    
    mutation.mutate({ 
      user_id: userId!, 
      house_id: houseId!, 
      day_date: dateKey, 
      status: nextStatus,
      is_cooking: false, 
      guest_count: 0,    
      note: current.note 
    });
  }, [userId, houseId, mutation, userPlans]);

  const toggleCooking = useCallback((dateKey: string) => {
    const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
    const nextIsCooking = !current.isCooking;
    const nextStatus = nextIsCooking ? 'available' : current.status;
    
    mutation.mutate({ 
      user_id: userId!, 
      house_id: houseId!, 
      day_date: dateKey, 
      status: nextStatus,
      is_cooking: nextIsCooking,
      guest_count: current.guestCount,
      note: current.note
    });
  }, [userId, houseId, mutation, userPlans]);

  const setGuestCount = useCallback((dateKey: string, count: number) => {
    const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
    const nextStatus = count > 0 ? 'available' : current.status;
    
    mutation.mutate({ 
      user_id: userId!, 
      house_id: houseId!, 
      day_date: dateKey, 
      status: nextStatus,
      is_cooking: current.isCooking,
      guest_count: count,
      note: current.note
    });
  }, [userId, houseId, mutation, userPlans]);

  const updateNote = useCallback((dateKey: string, note: string) => {
    const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
    
    mutation.mutate({ 
      user_id: userId!, 
      house_id: houseId!, 
      day_date: dateKey, 
      status: current.status,
      is_cooking: current.isCooking,
      guest_count: current.guestCount,
      note
    });
  }, [userId, houseId, mutation, userPlans]);

  return {
    weeks,
    userPlans,
    processedData,
    isLoading: isLoading && allMealPlans.length === 0,
    actions: {
      toggleStatus,
      toggleCooking,
      setGuestCount,
      updateNote,
    }
  };
}
