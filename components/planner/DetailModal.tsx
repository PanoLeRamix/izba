import React, { useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { format, type Locale } from 'date-fns';
import { ChefHat, Hand, MessageSquarePlus, MessageSquareText, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../BottomSheetModal';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { useAuthStore } from '../../store/authStore';
import { InputModal } from '../InputModal';
import { type PlannerStatus } from '../../services/planner';
import { type User } from '../../services/user';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  dateKey: string;
  eaters: Array<User & { guestCount?: number; note?: string }>;
  unavailable: User[];
  uncertain: Array<User & { note?: string }>;
  totalEatersCount: number;
  cooks: User[];
  isUserCooking: boolean;
  guestCount: number;
  note: string;
  status: PlannerStatus;
  onToggleStatus: (dateKey: string) => void;
  onToggleCooking: (dateKey: string) => void;
  onSetGuestCount: (dateKey: string, count: number) => void;
  onUpdateNote: (dateKey: string, content: string) => void;
  locale: Locale;
}

const IS_WEB = Platform.OS === 'web';
const MAX_NOTE_LENGTH = 20;

export const DetailModal = ({
  visible,
  onClose,
  date,
  dateKey,
  eaters,
  unavailable,
  uncertain,
  totalEatersCount,
  cooks,
  isUserCooking,
  guestCount,
  note,
  status,
  onToggleStatus,
  onToggleCooking,
  onSetGuestCount,
  onUpdateNote,
  locale,
}: DetailModalProps) => {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const [isEditingNote, setIsEditingNote] = useState(false);

  const renderMemberChip = (
    user: User & { guestCount?: number; note?: string },
    variant: 'eating' | 'unavailable' | 'uncertain' | 'cooking' = 'eating',
  ) => {
    const isMe = user.id === userId;
    let bgColor = isMe ? 'bg-forest/20' : 'bg-forest/5';
    let borderColor = isMe ? 'border-forest/40' : 'border-forest/10';
    let textColor = 'text-forest';
    let chipBg = isMe ? 'bg-forest' : 'bg-sage';
    let chipBorder = isMe ? 'border-forest' : 'border-sage';

    if (variant === 'unavailable') {
      bgColor = isMe ? 'bg-red-500/20' : 'bg-red-500/5';
      borderColor = isMe ? 'border-red-500/40' : 'border-red-500/10';
      textColor = 'text-red-600';
      chipBg = 'bg-red-500';
      chipBorder = 'border-red-500';
    } else if (variant === 'uncertain') {
      bgColor = isMe ? 'bg-amber-400/20' : 'bg-amber-400/10';
      borderColor = isMe ? 'border-amber-500/40' : 'border-amber-500/20';
      textColor = 'text-amber-700';
      chipBg = 'bg-amber-500';
      chipBorder = 'border-amber-500';
    }

    return (
      <View key={`${variant}-${user.id}`} className={`items-start ${user.note ? 'mb-5' : ''}`}>
        <View className="relative">
          <View className={`px-4 py-2 rounded-full border ${bgColor} ${borderColor}`}>
            <Text className={`font-bold text-sm ${textColor} ${variant === 'unavailable' ? 'line-through opacity-70' : ''}`}>{user.name}</Text>
          </View>

          {user.guestCount && user.guestCount > 0 ? (
            <View className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-lg border border-white shadow-sm z-20 ${chipBg} ${chipBorder}`}>
              <Text className="text-[10px] text-white font-black">+{user.guestCount}</Text>
            </View>
          ) : null}

          {user.note ? (
            <View className={`absolute top-[90%] right-0 px-2 py-1 rounded-xl border border-white shadow-sm z-10 ${chipBg} ${chipBorder}`} style={{ minWidth: 40, maxWidth: 110 }}>
              <Text className="text-white text-[9px] font-bold italic leading-tight" numberOfLines={2}>
                {user.note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        header={
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-1 mr-2">
              {date ? (
                <Text className="text-3xl font-black text-forest-dark uppercase leading-tight">
                  {format(date, 'EEE', { locale })}
                  {'\n'}
                  {format(date, 'd MMMM', { locale })}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => onToggleStatus(dateKey)}
              activeOpacity={0.7}
              style={{
                backgroundColor:
                  status === 'available'
                    ? Colors.status.availableBg
                    : status === 'unavailable'
                      ? Colors.status.unavailableBg
                      : Colors.status.noneBg,
                borderColor:
                  status === 'available'
                    ? Colors.status.availableBorder
                    : status === 'unavailable'
                      ? Colors.status.unavailableBorder
                      : Colors.status.noneBorder,
              }}
              className="px-5 py-3 items-center justify-center rounded-2xl border shadow-sm"
            >
              <Text
                className="font-black uppercase tracking-widest text-[10px]"
                style={{
                  color:
                    status === 'available'
                      ? Colors.status.available
                      : status === 'unavailable'
                        ? Colors.status.unavailable
                        : Colors.status.none,
                }}
              >
                {t(`planner.status.${status}`)}
              </Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👩‍🍳</Text>
                      <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.cooking')}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onToggleCooking(dateKey)}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${isUserCooking ? 'bg-forest/10 border-forest/30' : 'bg-sage-light/10 border-sage/20'}`}
                    >
                      {isUserCooking ? <ChefHat size={18} color={Colors.forest} strokeWidth={2.5} /> : <Hand size={18} color={Colors.forest} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {cooks.length > 0 ? cooks.map((user) => renderMemberChip(user, 'cooking')) : <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneCooking')}</Text>}
                  </View>
                </View>

        <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">🍽️</Text>
                      <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.eating')}</Text>
                      <View className="ml-2 bg-forest/10 px-2.5 py-0.5 rounded-full">
                        <Text className="text-forest text-xs font-black">{totalEatersCount}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setIsEditingNote(true)}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${note ? 'bg-forest/10 border-forest/30' : 'bg-sage-light/10 border-sage/20'}`}
                    >
                      {note ? (
                        <MessageSquareText size={18} color={Colors.forest} strokeWidth={2.5} />
                      ) : (
                        <MessageSquarePlus size={18} color={Colors.forest} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {eaters.length > 0 || uncertain.length > 0 || unavailable.length > 0 ? (
                      <>
                        {eaters.length > 0 ? (
                          <View className="w-full flex-row flex-wrap gap-x-3 gap-y-2">
                            {eaters.map((user) => renderMemberChip(user, 'eating'))}
                          </View>
                        ) : null}
                        {uncertain.length > 0 ? (
                          <View className="w-full mt-2 pt-2 border-t border-amber-100">
                            <Text className="mb-3 text-xs font-black uppercase tracking-[1px] text-amber-700">{t('planner.uncertain')}</Text>
                            <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                              {uncertain.map((user) => renderMemberChip(user, 'uncertain'))}
                            </View>
                          </View>
                        ) : null}
                        {unavailable.length > 0 ? (
                          <View className="w-full mt-2 pt-2 border-t border-red-100">
                            <Text className="mb-3 text-xs font-black uppercase tracking-[1px] text-red-600">{t('planner.status.unavailable')}</Text>
                            <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                              {unavailable.map((user) => renderMemberChip(user, 'unavailable'))}
                            </View>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneEating')}</Text>
                    )}
                  </View>
                </View>

        <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👋</Text>
                      <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.inviteFriends')}</Text>
                    </View>

                    <View className="flex-row items-center bg-sage-light/10 rounded-2xl border border-sage/20 p-1">
                      <TouchableOpacity
                        onPress={() => onSetGuestCount(dateKey, Math.max(0, guestCount - 1))}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-white border border-sage/10 shadow-sm"
                      >
                        <Minus size={20} color={Colors.forest} strokeWidth={3} />
                      </TouchableOpacity>

                      <View className="w-12 items-center justify-center">
                        <Text className="text-lg font-black text-forest-dark">{guestCount}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => onSetGuestCount(dateKey, guestCount + 1)}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-forest border border-forest shadow-sm"
                      >
                        <Plus size={20} color="white" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>
        </View>
      </BottomSheetModal>

      <InputModal
        visible={isEditingNote}
        onClose={() => setIsEditingNote(false)}
        onSave={(content) => {
          onUpdateNote(dateKey, content.replace(/\n/g, ' '));
          setIsEditingNote(false);
        }}
        title={t('planner.editNote')}
        initialValue={note}
        placeholder={t('planner.notePlaceholder')}
        maxLength={MAX_NOTE_LENGTH}
      />
    </>
  );
};
