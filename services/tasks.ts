import { supabase } from './supabase';

export interface TaskRotationConfig {
  house_id: string;
  anchor_week_start: string;
  created_at: string;
  updated_at: string;
}

export interface HouseTaskChore {
  id: string;
  house_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HouseTaskMemberOrderItem {
  user_id: string;
  house_id: string;
  name: string;
  sort_order: number;
}

export const tasksService = {
  async getRotationConfig(userToken: string) {
    const { data, error } = await supabase.rpc('get_house_task_rotation_config', {
      p_user_token: userToken,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as TaskRotationConfig | null;
  },

  async setAnchorWeek(userToken: string, anchorWeekStart: string) {
    const { data, error } = await supabase.rpc('set_house_task_rotation_anchor_week', {
      p_user_token: userToken,
      p_anchor_week_start: anchorWeekStart,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as TaskRotationConfig | null;
  },

  async getChores(userToken: string) {
    const { data, error } = await supabase.rpc('list_house_task_chores', {
      p_user_token: userToken,
    });

    if (error) throw error;
    return (data ?? []) as HouseTaskChore[];
  },

  async createChore(userToken: string, name: string) {
    const { data, error } = await supabase.rpc('create_house_task_chore', {
      p_user_token: userToken,
      p_name: name,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as HouseTaskChore | null;
  },

  async renameChore(userToken: string, choreId: string, name: string) {
    const { data, error } = await supabase.rpc('rename_house_task_chore', {
      p_user_token: userToken,
      p_chore_id: choreId,
      p_name: name,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as HouseTaskChore | null;
  },

  async deleteChore(userToken: string, choreId: string) {
    const { error } = await supabase.rpc('delete_house_task_chore', {
      p_user_token: userToken,
      p_chore_id: choreId,
    });

    if (error) throw error;
  },

  async reorderChores(userToken: string, choreIds: string[]) {
    const { data, error } = await supabase.rpc('reorder_house_task_chores', {
      p_user_token: userToken,
      p_chore_ids: choreIds,
    });

    if (error) throw error;
    return (data ?? []) as HouseTaskChore[];
  },

  async getMemberOrder(userToken: string) {
    const { data, error } = await supabase.rpc('list_house_task_member_order', {
      p_user_token: userToken,
    });

    if (error) throw error;
    return (data ?? []) as HouseTaskMemberOrderItem[];
  },

  async reorderMembers(userToken: string, userIds: string[]) {
    const { data, error } = await supabase.rpc('reorder_house_task_member_order', {
      p_user_token: userToken,
      p_user_ids: userIds,
    });

    if (error) throw error;
    return (data ?? []) as HouseTaskMemberOrderItem[];
  },
};
