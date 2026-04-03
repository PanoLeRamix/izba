import { supabase } from './supabase';

export interface House {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export const houseService = {
  async getHouse(houseToken: string) {
    const { data, error } = await supabase.rpc('get_current_house', {
      p_house_token: houseToken,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as House | null;
  },

  async updateName(userToken: string, name: string) {
    const { data, error } = await supabase.rpc('rename_current_house', {
      p_user_token: userToken,
      p_name: name,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as House | null;
  }
};
