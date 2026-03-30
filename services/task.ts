import { supabase } from './supabase';

export interface Task {
  id: string;
  name: string;
  house_id: string;
  order: number;
  rotation_offset: number;
  created_at?: string;
}

export const taskService = {
  async getHouseTasks(houseId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('house_id', houseId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Task[];
  },

  async createTask(houseId: string, name: string, order: number = 0, rotation_offset: number = 0) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ house_id: houseId, name, order, rotation_offset })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(taskId: string, name: string, rotation_offset?: number) {
    const updates: any = { name };
    if (rotation_offset !== undefined) updates.rotation_offset = rotation_offset;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  async updateTaskOrder(tasks: { id: string, order: number }[]) {
    const { error } = await Promise.all(
      tasks.map(task => 
        supabase
          .from('tasks')
          .update({ order: task.order })
          .eq('id', task.id)
      )
    );

    // Promise.all(results) - simplified error handling
    if (error) throw error;
  }
};
