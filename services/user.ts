import { supabase } from './supabase';

export interface User {
  id: string;
  name: string;
  house_id: string;
}

export const userService = {
  async getHouseUsers(houseToken: string) {
    const { data, error } = await supabase.rpc('list_house_users', {
      p_house_token: houseToken,
    });

    if (error) throw error;
    return data as User[];
  },

  async getUser(userToken: string) {
    const { data, error } = await supabase.rpc('get_current_user', {
      p_user_token: userToken,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as User | null;
  },

  async updateName(userToken: string, name: string) {
    const { data, error } = await supabase.rpc('rename_current_user', {
      p_user_token: userToken,
      p_name: name,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as User | null;
  },

  async deleteUser(userToken: string) {
    const { error } = await supabase.rpc('delete_current_user', {
      p_user_token: userToken,
    });

    if (error) throw error;
  }
};
