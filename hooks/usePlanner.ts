import { useMemo, useCallback } from 'react';
import { startOfWeek, addWeeks, addDays, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService, MealPlan, PlannerStatus } from '../services/planner';
import { userService, User } from '../services/user';
import { useAuthStore } from '../store/authStore';

const STATUS_CYCLE: PlannerStatus[] = ['none', 'available', 'unavailable'];

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

  const { data: allMealPlans = [], isLoading } = useQuery({
    queryKey: ['house-plans', houseId],
    queryFn: () => plannerService.getMealPlans(houseId!, weeks[0].days[0].dateKey, weeks[19].days[6].dateKey),
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5,
  });

  const userPlans = useMemo(() => {
    const map: Record<string, { status: PlannerStatus; isCooking: boolean; guestCount: number; note: string }> = {};
    allMealPlans.filter(p => p.user_id === userId).forEach(p => {
      map[p.day_date] = { 
        status: p.status as PlannerStatus, 
        isCooking: p.is_cooking, 
        guestCount: p.guest_count || 0, 
        note: p.note || '' 
      };
    });
    return map;
  }, [allMealPlans, userId]);

  const processedData = useMemo(() => {
    const map: Record<string, { eaters: (User & { guestCount: number, note?: string })[], totalCount: number, cooks: User[] }> = {};
    
    allMealPlans.forEach(p => {
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

    return map;
  }, [allMealPlans, users]);

  const mutation = useMutation({
    mutationFn: plannerService.upsertMealPlan,
    onMutate: async (newPlan) => {
      await queryClient.cancelQueries({ queryKey: ['house-plans', houseId] });
      const previousPlans = queryClient.getQueryData<MealPlan[]>(['house-plans', houseId]);

      queryClient.setQueryData(['house-plans', houseId], (old: MealPlan[] | undefined) => {
        const filtered = (old || []).filter(p => !(p.user_id === newPlan.user_id && p.day_date === newPlan.day_date));
        return [...filtered, { ...newPlan, id: 'temp-id' } as MealPlan];
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
