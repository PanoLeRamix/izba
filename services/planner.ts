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
}

export const plannerService = {
  async getMealPlans(houseId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('house_id', houseId)
      .gte('day_date', startDate)
      .lte('day_date', endDate);

    if (error) throw error;
    return data as MealPlan[];
  },

  async upsertMealPlan(plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert(plan, { onConflict: 'user_id,day_date' })
      .select()
      .single();

    if (error) throw error;
    return data as MealPlan;
  }
};
