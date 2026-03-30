import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  ScrollView,
  Alert,
  Platform,
  Pressable
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, X, User as UserIcon, ChevronUp, ChevronDown, UserCircle, Info } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../Button';
import { InputModal } from '../InputModal';
import { userService } from '../../services/user';
import { useAuthStore } from '../../store/authStore';

interface TaskConfigModalProps {
  visible: boolean;
  onClose: () => void;
  actions: {
    createTask: (name: string) => Promise<void>;
    updateTask: (taskId: string, name: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    setTaskPerson: (taskId: string, userId: string) => Promise<void>;
    reorderMembers: (newUsers: any[]) => Promise<void>;
    tasks: any[];
    users: any[];
  };
}

export const TaskConfigModal = ({
  visible,
  onClose,
  actions
}: TaskConfigModalProps) => {
  const { t } = useTranslation();
  const { houseId } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAssigning, setIsAssigning] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRotationHint, setShowRotationHint] = useState(false);

  // Local mutation for reordering to ensure immediate UI feedback via cache invalidation
  const reorderMutation = useMutation({
    mutationFn: (newUsers: any[]) => userService.updateRotationOrder(newUsers.map((u, i) => ({ ...u, rotation_order: i }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-users', houseId] });
      queryClient.invalidateQueries({ queryKey: ['house-tasks', houseId] });
    },
  });

  const handleCreate = async (name: string) => {
    setLoading(true);
    try {
      await actions.createTask(name);
      setIsAdding(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (name: string) => {
    if (!editingTask) return;
    setLoading(true);
    try {
      await actions.updateTask(editingTask.id, name);
      setEditingTask(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    const performDelete = async () => {
      setLoading(true);
      try {
        await actions.deleteTask(taskId);
        if (editingTask?.id === taskId) setEditingTask(null);
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('tasks.confirmDelete'))) {
        performDelete();
      }
    } else {
      Alert.alert(
        t('tasks.delete'),
        t('tasks.confirmDelete'),
        [
          { text: t('common.back'), style: 'cancel' },
          { text: t('tasks.delete'), style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleAssign = async (userId: string) => {
    if (!isAssigning) return;
    setLoading(true);
    try {
      await actions.setTaskPerson(isAssigning.id, userId);
      setIsAssigning(null);
      setEditingTask(null); // Close edit modal too
    } finally {
      setLoading(false);
    }
  };

  const moveMember = async (index: number, direction: 'up' | 'down') => {
    const newUsers = [...actions.users];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newUsers.length) return;
    
    [newUsers[index], newUsers[targetIndex]] = [newUsers[targetIndex], newUsers[index]];
    
    reorderMutation.mutate(newUsers);
  };

  const isReordering = reorderMutation.isPending;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable 
          className="absolute inset-0 bg-black/50" 
          onPress={onClose} 
        />
        <View className="bg-hearth rounded-t-[40px] p-8 max-h-[85%] border-t border-sage/20">
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-2xl font-black text-forest-dark uppercase">
              {t('tasks.config')}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-sage/10 rounded-full">
              <X size={20} color={Colors.forest} />
            </TouchableOpacity>
          </View>

          <ScrollView className="mb-8" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              {/* Tasks Section */}
              <View className="space-y-3">
                {actions.tasks.map((task) => (
                  <View 
                    key={task.id}
                    className="bg-white p-4 rounded-[32px] border border-sage/10"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-lg font-black text-forest-dark ml-2">
                        {task.name}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => setEditingTask(task)}
                        className="p-2 bg-forest/5 rounded-full"
                      >
                        <Edit2 size={18} color={Colors.forestLight} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {actions.tasks.length === 0 && (
                  <View className="items-center py-8">
                    <Text className="text-forest-light font-medium italic">
                      {t('tasks.noTasks')}
                    </Text>
                  </View>
                )}

                <Button 
                  title={t('tasks.addTask')} 
                  onPress={() => setIsAdding(true)}
                  icon={<Plus size={20} color="white" />}
                />
              </View>

              {/* Members Reordering Section */}
              <View className="mt-4 pt-6 border-t border-sage/20">
                <Text className="text-sm font-black text-forest-dark/40 uppercase mb-4 tracking-widest px-2">
                  {t('tasks.rotationOrder')}
                </Text>
                <View className="bg-white/50 rounded-[32px] p-2 border border-sage/10">
                  {actions.users.map((member, index) => (
                    <View 
                      key={member.id} 
                      className={`flex-row items-center justify-between p-4 ${index !== actions.users.length - 1 ? 'border-b border-sage/5' : ''}`}
                    >
                      <Text className="text-base font-bold text-forest-dark">
                        {member.name}
                      </Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity 
                          onPress={() => moveMember(index, 'up')}
                          disabled={index === 0 || isReordering}
                          className={`p-2 ${index === 0 || isReordering ? 'opacity-20' : ''}`}
                        >
                          <ChevronUp size={20} color={Colors.forest} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => moveMember(index, 'down')}
                          disabled={index === actions.users.length - 1 || isReordering}
                          className={`p-2 ${index === actions.users.length - 1 || isReordering ? 'opacity-20' : ''}`}
                        >
                          <ChevronDown size={20} color={Colors.forest} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View>
            <Button 
              title={t('common.back')} 
              variant="outline"
              onPress={onClose} 
            />
          </View>

          {/* Nested Modals */}
          <InputModal
            visible={isAdding}
            onClose={() => setIsAdding(false)}
            onSave={handleCreate}
            title={t('tasks.addTask')}
            placeholder="Ex: Ménage, Vaisselle..."
            loading={loading}
          />

          <InputModal
            visible={!!editingTask}
            onClose={() => {
              setEditingTask(null);
              setShowRotationHint(false);
            }}
            onSave={handleUpdate}
            onDelete={() => handleDelete(editingTask.id)}
            deleteLabel={t('tasks.delete')}
            title={t('tasks.editTask')}
            initialValue={editingTask?.name}
            loading={loading}
          >
            <View className="mt-2 mb-6">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => setIsAssigning(editingTask)}
                  className="flex-1 flex-row items-center justify-center bg-chef/5 p-4 rounded-2xl border border-dashed border-chef/30"
                >
                  <UserCircle size={20} color={Colors.chef} />
                  <View className="w-3" />
                  <Text className="text-sm font-bold text-chef uppercase">
                    {t('tasks.whoIsDoingThisThisWeek')}
                  </Text>
                </TouchableOpacity>
                <View className="w-2" />
                <TouchableOpacity 
                  onPress={() => setShowRotationHint(!showRotationHint)}
                  className={`p-4 rounded-2xl border ${showRotationHint ? 'bg-forest/10 border-forest/20' : 'bg-forest/5 border-forest/10'}`}
                >
                  <Info size={20} color={Colors.forestLight} />
                </TouchableOpacity>
              </View>

              {showRotationHint && (
                <View className="mt-4 flex-row bg-forest/5 p-4 rounded-2xl border border-forest/10 items-start">
                  <Info size={14} color={Colors.forestLight} className="mt-0.5" />
                  <View className="w-2" />
                  <Text className="flex-1 text-[11px] font-bold text-forest-light/60 leading-4">
                    {t('tasks.rotationHint')}
                  </Text>
                </View>
              )}

              <View className="mt-6 border-t border-sage/20" />
            </View>
          </InputModal>

          {/* Assignment Picker Modal */}
          <Modal visible={!!isAssigning} transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-center p-6">
              <View className="bg-hearth p-8 rounded-[40px] shadow-2xl">
                <Text className="text-xl font-black text-forest-dark uppercase mb-2 text-center">
                  {isAssigning?.name}
                </Text>
                <Text className="text-xs font-bold text-forest-light/60 uppercase mb-8 text-center tracking-widest">
                  {t('tasks.whoIsDoingThisThisWeekShort')}
                </Text>
                
                <View className="mb-8">
                  <ScrollView className="max-h-[300px]">
                    <View className="space-y-3">
                      {actions.users.map(u => (
                        <TouchableOpacity 
                          key={u.id}
                          onPress={() => handleAssign(u.id)}
                          className="bg-white p-4 rounded-[24px] border border-sage/10 items-center"
                        >
                          <Text className="text-base font-bold text-forest-dark">{u.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <Button variant="outline" title={t('common.back')} onPress={() => setIsAssigning(null)} />
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};