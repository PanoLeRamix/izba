import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  loading = false, 
  disabled = false 
}: ButtonProps) => {
  const isPrimary = variant === 'primary';
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-xl items-center flex-row justify-center ${
        isPrimary ? 'bg-blue-500' : 'border-2 border-blue-500'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? 'white' : '#3b82f6'} />
      ) : (
        <Text className={`font-semibold text-lg ${isPrimary ? 'text-white' : 'text-blue-500'}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
