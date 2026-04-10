import React from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

export type MemberChipVariant = 'eating' | 'unavailable' | 'uncertain' | 'cooking';

interface MemberChipProps {
  name: string;
  isMe?: boolean;
  guestCount?: number;
  note?: string;
  variant?: MemberChipVariant;
}

export const MemberChip = ({
  name,
  isMe = false,
  guestCount = 0,
  note,
  variant = 'eating',
}: MemberChipProps) => {
  // Theme defaults (eating/cooking)
  let bgColor = isMe ? `${Colors.primary}20` : `${Colors.primary}0D`; // 12% or 5%
  let borderColor = isMe ? `${Colors.primary}66` : `${Colors.primary}1A`; // 40% or 10%
  let textColor = Colors.primary;
  let bubbleColor = isMe ? Colors.primary : Colors.secondary;

  if (variant === 'unavailable') {
    bgColor = isMe ? `${Colors.status.unavailable}33` : `${Colors.status.unavailable}0D`;
    borderColor = isMe ? `${Colors.status.unavailable}66` : `${Colors.status.unavailable}1A`;
    textColor = Colors.status.unavailable;
    bubbleColor = Colors.status.unavailable;
  } else if (variant === 'uncertain') {
    bgColor = isMe ? `${Colors.status.none}33` : Colors.status.noneBg;
    borderColor = isMe ? `${Colors.status.none}66` : Colors.status.noneBorder;
    textColor = Colors.status.none;
    bubbleColor = Colors.status.none;
  }

  return (
    <View className={`items-start ${note ? 'mb-5' : 'mb-2'}`}>
      <View className="relative">
        <View 
          className="px-4 py-2 rounded-full border"
          style={{ backgroundColor: bgColor, borderColor: borderColor }}
        >
          <Text 
            className={`font-bold text-sm ${variant === 'unavailable' ? 'line-through opacity-70' : ''}`}
            style={{ color: textColor }}
          >
            {name}
          </Text>
        </View>

        {guestCount > 0 ? (
          <View 
            className="absolute -top-2 -right-3 px-1.5 py-0.5 rounded-lg border border-surface shadow-sm z-20"
            style={{ backgroundColor: bubbleColor, borderColor: bubbleColor }}
          >
            <Text className="text-[10px] text-white font-black">+{guestCount}</Text>
          </View>
        ) : null}

        {note ? (
          <View 
            className="absolute top-[90%] right-0 px-2 py-1 rounded-xl border border-surface shadow-sm z-10"
            style={{ backgroundColor: bubbleColor, borderColor: bubbleColor }}
          >
            <Text className="text-white text-[9px] font-bold italic leading-tight" numberOfLines={2}>
              {note}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
