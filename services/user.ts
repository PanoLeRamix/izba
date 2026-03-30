import { supabase } from './supabase';

export interface User {
  id: string;
  name: string;
  house_id: string;
  rotation_order: number;
}

export const userService = {
  async getHouseUsers(houseId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('house_id', houseId)
      .order('rotation_order', { ascending: true })
      .order('created_at', { ascending: true });

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

  async updateRotationOrder(users: { id: string, rotation_order: number }[]) {
    const { error } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
