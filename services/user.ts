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
  }
};
