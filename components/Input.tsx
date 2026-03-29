import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  autoCapitalize = 'none'
}: InputProps) => {
  return (
    <View className="w-full mb-4">
      {label && <Text className="text-hearth-earth mb-2 font-medium">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3B18A"
        autoCapitalize={autoCapitalize}
        className="w-full bg-sage-light/30 p-4 rounded-2xl text-lg text-hearth-earth border border-sage/30"
      />
    </View>
  );
};
