import { supabase } from './supabase';

export type PlannerStatus = 'none' | 'available' | 'unavailable';

export interface MealPlan {
  id?: string;
  user_id: string;
  house_id: string;
  day_date: string;
  status: PlannerStatus;
  is_cooking: boolean;
  guest_count: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export const plannerService = {
  async getMealPlans(userToken: string, startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('list_meal_plans', {
      p_user_token: userToken,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw error;
    return data as MealPlan[];
  },

  async upsertMealPlan(plan: { userToken: string; dayDate: string; status: PlannerStatus; isCooking: boolean; guestCount: number; note?: string }) {
    const { data, error } = await supabase.rpc('upsert_my_meal_plan', {
      p_user_token: plan.userToken,
      p_day_date: plan.dayDate,
      p_status: plan.status,
      p_is_cooking: plan.isCooking,
      p_guest_count: plan.guestCount,
      p_note: plan.note ?? '',
    });

    if (error) throw error;
    return (data?.[0] ?? null) as MealPlan | null;
  }
};
