import React, { forwardRef } from 'react';
import { View, Text, TextInput } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  secureTextEntry?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  autoCapitalize = 'words',
  error,
  secureTextEntry
}, ref) => {
  return (
    <View className="w-full mb-4">
      {label && <Text className="text-hearth-earth mb-2 font-medium">{label}</Text>}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3B18A"
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        className={`w-full bg-sage-light/30 p-4 rounded-2xl text-lg text-hearth-earth border ${error ? 'border-red-400' : 'border-sage/30'}`}
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1 ml-1 font-bold uppercase">{error}</Text>
      ) : null}
    </View>
  );
});
