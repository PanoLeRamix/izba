import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, X, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../Button';
import { InputModal } from '../InputModal';

interface TaskConfigModalProps {
  visible: boolean;
  onClose: () => void;
  actions: {
    createTask: (name: string) => Promise<void>;
    updateTask: (taskId: string, name: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    setTaskPerson: (taskId: string, userId: string) => Promise<void>;
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
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAssigning, setIsAssigning] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
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
                <View className="space-y-3">
                  {actions.tasks.map((task) => (
                    <View 
                      key={task.id}
                      className="bg-white p-4 rounded-[32px] border border-sage/10"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="flex-1 text-lg font-black text-forest-dark ml-2">
                          {task.name}
                        </Text>
                        <View className="flex-row">
                          <TouchableOpacity 
                            onPress={() => setEditingTask(task)}
                            className="p-2 mr-1 bg-forest/5 rounded-full"
                          >
                            <Edit2 size={18} color={Colors.forestLight} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDelete(task.id)}
                            className="p-2 bg-status-unavailable/5 rounded-full"
                          >
                            <Trash2 size={18} color={Colors.status.unavailable} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                        onPress={() => setIsAssigning(task)}
                        className="flex-row items-center bg-sage/5 p-3 rounded-2xl border border-dashed border-sage/30"
                      >
                        <UserIcon size={14} color={Colors.chef} className="mr-2" />
                        <Text className="text-xs font-bold text-forest-light uppercase">
                          {t('tasks.whoIsDoingThisThisWeek')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {actions.tasks.length === 0 && (
                    <View className="items-center py-8">
                      <Text className="text-forest-light font-medium italic">
                        {t('tasks.noTasks')}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              <Button 
                title={t('tasks.addTask')} 
                onPress={() => setIsAdding(true)}
                icon={<Plus size={20} color="white" />}
              />
              
              <View className="mt-4">
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
                onClose={() => setEditingTask(null)}
                onSave={handleUpdate}
                onDelete={() => handleDelete(editingTask.id)}
                deleteLabel={t('tasks.delete')}
                title={t('tasks.editTask')}
                initialValue={editingTask?.name}
                loading={loading}
              />

              {/* Assignment Picker Modal */}
              <Modal visible={!!isAssigning} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center p-6">
                  <View className="bg-hearth p-8 rounded-[40px] shadow-2xl">
                    <Text className="text-xl font-black text-forest-dark uppercase mb-6 text-center">
                      {isAssigning?.name}
                    </Text>
                    <Text className="text-sm font-bold text-forest-light/60 uppercase mb-6 text-center tracking-widest">
                      {t('tasks.whoIsDoingThisThisWeek')}
                    </Text>
                    
                    <View className="space-y-3 mb-8">
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

                    <Button variant="outline" title={t('common.back')} onPress={() => setIsAssigning(null)} />
                  </View>
                </View>
              </Modal>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
