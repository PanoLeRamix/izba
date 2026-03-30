import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  icon,
  style,
  textStyle
}: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      className={`w-full py-4 rounded-2xl items-center flex-row justify-center ${
        isPrimary ? 'bg-forest' : isOutline ? 'border-2 border-forest' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#F9F7F2' : '#2D5A27'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text 
            style={textStyle}
            className={`font-semibold text-lg ${
              isPrimary ? 'text-hearth' : 'text-forest'
            }`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
