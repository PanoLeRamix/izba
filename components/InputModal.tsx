import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  Platform, 
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';
import { Input } from './Input';
import { Button } from './Button';

import { Trash2 } from 'lucide-react-native';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  onDelete?: () => void;
  deleteLabel?: string;
  title: string;
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  loading?: boolean;
  children?: React.ReactNode;
}

export const InputModal = ({
  visible,
  onClose,
  onSave,
  onDelete,
  deleteLabel,
  title,
  initialValue = '',
  placeholder,
  maxLength,
  loading = false,
  children
}: InputModalProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, initialValue]);

  // Web-specific visual viewport tracking
  useEffect(() => {
    if (Platform.OS !== 'web' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleSave = () => {
    onSave(value);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View 
          className="flex-1 justify-center items-center p-6"
          style={[
            { backgroundColor: Colors.backdrop },
            Platform.OS === 'web' ? { paddingBottom: keyboardOffset } : {}
          ]}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-full max-w-md items-center"
            >
              <View className="bg-hearth w-full p-8 rounded-3xl border border-sage/20 shadow-xl">
                <Text className="text-2xl font-bold mb-6 text-forest-dark">
                  {title}
                </Text>
                
                <Input 
                  ref={inputRef}
                  value={value}
                  onChangeText={(text) => {
                    if (maxLength) {
                      setValue(text.slice(0, maxLength));
                    } else {
                      setValue(text);
                    }
                  }}
                  placeholder={placeholder}
                  maxLength={maxLength}
                />

                {maxLength && (
                  <View className="flex-row justify-end mb-2 px-1">
                    <Text className={`text-[10px] font-bold uppercase ${value.length >= maxLength ? 'text-red-500' : 'text-forest-dark/30'}`}>
                      {value.length} / {maxLength}
                    </Text>
                  </View>
                )}

                {children}

                <View className="mt-4">
                  <Button 
                    title={t('auth.save')} 
                    onPress={handleSave} 
                    loading={loading}
                    disabled={!value.trim()}
                  />
                </View>
                <View className="mt-4">
                  <Button 
                    title={t('common.back')} 
                    variant="outline"
                    onPress={onClose} 
                  />
                </View>

                {onDelete && (
                  <View className="mt-8 pt-6 border-t border-sage/20">
                    <Button 
                      title={deleteLabel || t('main.deleteIdentity')} 
                      onPress={onDelete} 
                      variant="ghost"
                      icon={<Trash2 size={18} color={Colors.status.unavailable} />}
                      textStyle={{ color: Colors.status.unavailable, fontSize: 14 }}
                    />
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
