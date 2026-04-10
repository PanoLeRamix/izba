import React, { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, value, onChangeText, placeholder, autoCapitalize = 'words', error, secureTextEntry, maxLength, ...rest }, ref) => {
    return (
      <View className="w-full mb-4">
        {label ? <Text className="text-tertiary mb-2 font-medium">{label}</Text> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.secondary}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          {...rest}
          className={`w-full bg-secondary-container/30 p-4 rounded-2xl text-lg text-tertiary border ${error ? 'border-red-400' : 'border-secondary/30'}`}
        />
        {error ? <Text className="text-red-500 text-xs mt-1 ml-1 font-bold uppercase">{error}</Text> : null}
      </View>
    );
  },
);
