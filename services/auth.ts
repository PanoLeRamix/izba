import { supabase } from './supabase';

export interface HouseSession {
  houseId: string;
  houseName: string;
  houseToken: string;
  code?: string;
}

export interface UserSession {
  id: string;
  name: string;
  houseId: string;
  userToken: string;
}

interface HouseRpcRow {
  house_id: string;
  house_name: string;
  house_token: string;
  code?: string;
}

interface UserRpcRow {
  id: string;
  name: string;
  house_id: string;
  user_token: string;
}

function getSingleRow<T>(rows: T[] | null, fallbackMessage: string): T {
  const row = rows?.[0];

  if (!row) {
    throw new Error(fallbackMessage);
  }

  return row;
}

function mapHouseSession(row: HouseRpcRow): HouseSession {
  return {
    houseId: row.house_id,
    houseName: row.house_name,
    houseToken: row.house_token,
    code: row.code,
  };
}

function mapUserSession(row: UserRpcRow): UserSession {
  return {
    id: row.id,
    name: row.name,
    houseId: row.house_id,
    userToken: row.user_token,
  };
}

export const authService = {
  async createHouse(name: string) {
    const { data, error } = await supabase.rpc('create_house', {
      p_name: name,
    });

    if (error) {
      throw error;
    }

    return mapHouseSession(getSingleRow(data as HouseRpcRow[] | null, 'Failed to create house session.'));
  },

  async joinHouse(code: string) {
    const { data, error } = await supabase.rpc('join_house', {
      p_code: code,
    });

    if (error) {
      throw error;
    }

    return mapHouseSession(getSingleRow(data as HouseRpcRow[] | null, 'House not found.'));
  },

  async listHouseUsers(houseToken: string) {
    const { data, error } = await supabase.rpc('list_house_users', {
      p_house_token: houseToken,
    });

    if (error) {
      throw error;
    }

    return (data ?? []) as Array<{ id: string; name: string; house_id: string }>;
  },

  async createUser(houseToken: string, name: string) {
    const { data, error } = await supabase.rpc('create_house_user', {
      p_house_token: houseToken,
      p_name: name,
    });

    if (error) {
      throw error;
    }

    return mapUserSession(getSingleRow(data as UserRpcRow[] | null, 'Failed to create user.'));
  },

  async selectUser(houseToken: string, userId: string) {
    const { data, error } = await supabase.rpc('select_house_user', {
      p_house_token: houseToken,
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    return mapUserSession(getSingleRow(data as UserRpcRow[] | null, 'Failed to select user.'));
  },
};

export function isInvalidSessionError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
  return message.includes('invalid') && message.includes('session');
}
