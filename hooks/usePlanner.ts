import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { plannerService, type MealPlan, type PlannerStatus } from '../services/planner';
import { userService, type User } from '../services/user';
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

interface UserPlan {
  status: PlannerStatus;
  isCooking: boolean;
  guestCount: number;
  note: string;
}

interface ProcessedDay {
  eaters: Array<User & { guestCount: number; note?: string }>;
  unavailable: User[];
  totalCount: number;
  cooks: User[];
}

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(style);
  }
};

export function usePlanner() {
  const { userId, userToken, houseId, houseToken } = useAuthStore();
  const queryClient = useQueryClient();

  const weeks = useMemo(() => {
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

    return Array.from({ length: PLANNER_WEEK_COUNT }, (_, index) => {
      const weekStart = addWeeks(startOfCurrentWeek, index - CURRENT_WEEK_INDEX);

      return {
        id: `week-${index - CURRENT_WEEK_INDEX}`,
        startDate: weekStart,
        days: Array.from({ length: 7 }, (_, dayOffset) => {
          const date = addDays(weekStart, dayOffset);
          return { date, dateKey: format(date, 'yyyy-MM-dd') };
        }),
      };
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['house-users', houseId],
    queryFn: () => userService.getHouseUsers(houseToken!),
    enabled: !!houseId && !!houseToken,
  });

  const { data: allMealPlans = [], isLoading } = useQuery({
    queryKey: ['house-plans', houseId],
    queryFn: () => {
      const firstDay = weeks[0].days[0].dateKey;
      const lastDay = weeks[PLANNER_WEEK_COUNT - 1].days[6].dateKey;
      return plannerService.getMealPlans(userToken!, firstDay, lastDay);
    },
    enabled: !!houseId && !!userToken,
    staleTime: 1000 * 60 * 5,
  });

  const userPlans = useMemo<Record<string, UserPlan>>(() => {
    const map: Record<string, UserPlan> = {};

    for (const plan of allMealPlans) {
      if (plan.user_id !== userId) {
        continue;
      }

      map[plan.day_date] = {
        status: plan.status as PlannerStatus,
        isCooking: plan.is_cooking,
        guestCount: plan.guest_count || 0,
        note: plan.note || '',
      };
    }

    return map;
  }, [allMealPlans, userId]);

  const processedData = useMemo<Record<string, ProcessedDay>>(() => {
    const processed: Record<string, ProcessedDay> = {};
    const userMap = users.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
    const plansByDate = allMealPlans.reduce<Record<string, MealPlan[]>>((acc, plan) => {
      if (!acc[plan.day_date]) {
        acc[plan.day_date] = [];
      }

      acc[plan.day_date].push(plan);
      return acc;
    }, {});

    for (const [dateKey, dayPlans] of Object.entries(plansByDate)) {
      const eaters: Array<User & { guestCount: number; note?: string }> = [];
      const unavailable: User[] = [];
      const cooks: User[] = [];
      let totalCount = 0;

      for (const plan of dayPlans) {
        const user = userMap[plan.user_id];

        if (!user) {
          continue;
        }

        if (plan.status === 'available') {
          const guests = plan.guest_count || 0;
          eaters.push({ ...user, guestCount: guests, note: plan.note || undefined });
          totalCount += 1 + guests;
        } else if (plan.status === 'unavailable') {
          unavailable.push(user);
        }

        if (plan.is_cooking) {
          cooks.push(user);
        }
      }

      const sortUsers = (left: User, right: User) => {
        if (left.id === userId) return -1;
        if (right.id === userId) return 1;
        return left.name.localeCompare(right.name);
      };

      eaters.sort(sortUsers);
      unavailable.sort(sortUsers);
      cooks.sort(sortUsers);

      processed[dateKey] = { eaters, unavailable, totalCount, cooks };
    }

    return processed;
  }, [allMealPlans, userId, users]);

  const mutation = useMutation({
    mutationFn: plannerService.upsertMealPlan,
    onMutate: async (newPlan) => {
      if (!houseId || !userId) {
        return { previousPlans: [] as MealPlan[] };
      }

      await queryClient.cancelQueries({ queryKey: ['house-plans', houseId] });
      const previousPlans = queryClient.getQueryData<MealPlan[]>(['house-plans', houseId]) ?? [];

      queryClient.setQueryData<MealPlan[]>(['house-plans', houseId], (old = []) => {
        const filtered = old.filter((plan) => !(plan.user_id === userId && plan.day_date === newPlan.dayDate));
        const optimisticPlan: MealPlan = {
          id: 'temp-id',
          user_id: userId,
          house_id: houseId,
          day_date: newPlan.dayDate,
          status: newPlan.status,
          is_cooking: newPlan.isCooking,
          guest_count: newPlan.guestCount,
          note: newPlan.note ?? '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return [...filtered, optimisticPlan];
      });

      return { previousPlans };
    },
    onError: (_error, _variables, context) => {
      if (houseId) {
        queryClient.setQueryData(['house-plans', houseId], context?.previousPlans ?? []);
      }
    },
    onSettled: () => {
      if (houseId) {
        void queryClient.invalidateQueries({ queryKey: ['house-plans', houseId] });
      }
    },
  });

  const toggleStatus = useCallback(
    (dateKey: string) => {
      if (!userToken) return;

      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current.status) + 1) % STATUS_CYCLE.length];

      mutation.mutate({
        userToken,
        dayDate: dateKey,
        status: nextStatus,
        isCooking: false,
        guestCount: 0,
        note: current.note,
      });
    },
    [mutation, userPlans, userToken],
  );

  const toggleCooking = useCallback(
    (dateKey: string) => {
      if (!userToken) return;

      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };
      const nextIsCooking = !current.isCooking;

      mutation.mutate({
        userToken,
        dayDate: dateKey,
        status: nextIsCooking ? 'available' : current.status,
        isCooking: nextIsCooking,
        guestCount: current.guestCount,
        note: current.note,
      });
    },
    [mutation, userPlans, userToken],
  );

  const setGuestCount = useCallback(
    (dateKey: string, count: number) => {
      if (!userToken) return;

      const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };

      mutation.mutate({
        userToken,
        dayDate: dateKey,
        status: count > 0 ? 'available' : current.status,
        isCooking: current.isCooking,
        guestCount: count,
        note: current.note,
      });
    },
    [mutation, userPlans, userToken],
  );

  const updateNote = useCallback(
    (dateKey: string, note: string) => {
      if (!userToken) return;

      const current = userPlans[dateKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' };

      mutation.mutate({
        userToken,
        dayDate: dateKey,
        status: current.status,
        isCooking: current.isCooking,
        guestCount: current.guestCount,
        note,
      });
    },
    [mutation, userPlans, userToken],
  );

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
    },
  };
}
