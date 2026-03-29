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
      {label && <Text className="text-gray-700 mb-2 font-medium">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        className="w-full bg-gray-100 p-4 rounded-xl text-lg text-gray-800 border border-gray-200"
      />
    </View>
  );
};
