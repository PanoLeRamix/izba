import { supabase } from './supabase';

export interface HouseShoppingItem {
  id: string;
  house_id: string;
  name: string;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const shoppingService = {
  async listItems(userToken: string) {
    const { data, error } = await supabase.rpc('list_house_shopping_items', {
      p_user_token: userToken,
    });

    if (error) throw error;
    return (data ?? []) as HouseShoppingItem[];
  },

  async createItem(userToken: string, name: string) {
    const { data, error } = await supabase.rpc('create_house_shopping_item', {
      p_user_token: userToken,
      p_name: name,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as HouseShoppingItem | null;
  },

  async setItemChecked(userToken: string, itemId: string, checked: boolean) {
    const { data, error } = await supabase.rpc('set_house_shopping_item_checked', {
      p_user_token: userToken,
      p_item_id: itemId,
      p_checked: checked,
    });

    if (error) throw error;
    return (data?.[0] ?? null) as HouseShoppingItem | null;
  },
};
