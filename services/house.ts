import { supabase } from './supabase';

export interface House {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export const houseService = {
  async getHouse(houseId: string) {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('id', houseId)
      .single();

    if (error) throw error;
    return data as House;
  },

  async updateName(houseId: string, name: string) {
    const { data, error } = await supabase
      .from('houses')
      .update({ name })
      .eq('id', houseId)
      .select()
      .single();

    if (error) throw error;
    return data as House;
  }
};
