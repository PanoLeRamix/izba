import { supabase } from './supabase';

export interface User {
  id: string;
  name: string;
  house_id: string;
}

export const userService = {
  async getHouseUsers(houseId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('house_id', houseId);

    if (error) throw error;
    return data as User[];
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  },

  async updateName(userId: string, name: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
