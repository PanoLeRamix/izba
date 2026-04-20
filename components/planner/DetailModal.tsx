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
import { MemberChip } from '../MemberChip';

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

  const statusStyle = status === 'available' 
    ? { bg: Colors.status.availableBg, text: Colors.status.available, border: 'transparent' }
    : status === 'unavailable'
    ? { bg: Colors.status.unavailableBg, text: Colors.status.unavailable, border: 'transparent' }
    : { bg: Colors.status.noneBg, text: Colors.status.none, border: 'transparent' };

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        backgroundColor={Colors.surfaceContainerLow}
        header={
          <View className="mb-8 flex-row items-center justify-between">
            {date ? (
              <Text className="text-3xl font-black text-primary uppercase leading-tight">
                {format(date, 'EEEE d MMMM', { locale })}
              </Text>
            ) : null}
          </View>
        }
      >
        <View className="bg-surface p-6 mb-4 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👩‍🍳</Text>
                      <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('planner.cooking')}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onToggleCooking(dateKey)}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${isUserCooking ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-low border-outline-variant/20'}`}
                    >
                      {isUserCooking ? <ChefHat size={18} color={Colors.primary} strokeWidth={2.5} /> : <Hand size={18} color={Colors.primary} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {cooks.length > 0 ? (
                      cooks.map((user) => (
                        <MemberChip key={`cook-${user.id}`} name={user.name} isMe={user.id === userId} variant="cooking" />
                      ))
                    ) : (
                      <Text className="text-on-surface-variant/40 italic font-medium">{t('planner.noOneCooking')}</Text>
                    )}
                  </View>
                </View>

        <View className="bg-surface p-6 mb-4 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">🍽️</Text>
                      <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('planner.eating')}</Text>
                      <View className="ml-2 bg-primary/10 px-2.5 py-0.5 rounded-full">
                        <Text className="text-primary text-xs font-black">{totalEatersCount}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setIsEditingNote(true)}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${note ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-low border-outline-variant/20'}`}
                    >
                      {note ? (
                        <MessageSquareText size={18} color={Colors.primary} strokeWidth={2.5} />
                      ) : (
                        <MessageSquarePlus size={18} color={Colors.primary} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {eaters.length > 0 || uncertain.length > 0 || unavailable.length > 0 ? (
                      <>
                        {eaters.length > 0 ? (
                          <View className="w-full flex-row flex-wrap gap-x-3 gap-y-2">
                            {eaters.map((user) => (
                              <MemberChip key={`eater-${user.id}`} name={user.name} isMe={user.id === userId} guestCount={user.guestCount} note={user.note} variant="eating" />
                            ))}
                          </View>
                        ) : null}
                        {uncertain.length > 0 ? (
                          <View className="w-full mt-2 pt-2 border-t border-outline-variant/10">
                            <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                              {uncertain.map((user) => (
                                <MemberChip key={`uncertain-${user.id}`} name={user.name} isMe={user.id === userId} note={user.note} variant="uncertain" />
                              ))}
                            </View>
                          </View>
                        ) : null}
                        {unavailable.length > 0 ? (
                          <View className="w-full mt-2 pt-2 border-t border-outline-variant/10">
                            <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                              {unavailable.map((user) => (
                                <MemberChip key={`unavailable-${user.id}`} name={user.name} isMe={user.id === userId} variant="unavailable" />
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text className="text-on-surface-variant/40 italic font-medium">{t('planner.noOneEating')}</Text>
                    )}
                  </View>
                </View>

        <View className="bg-surface p-6 mb-4 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👋</Text>
                      <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('planner.inviteFriends')}</Text>
                    </View>

                    <View className="flex-row items-center bg-surface-container-low rounded-2xl border border-outline-variant/10 p-1">
                      <TouchableOpacity
                        onPress={() => onSetGuestCount(dateKey, Math.max(0, guestCount - 1))}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-surface border border-outline-variant/10 shadow-sm"
                      >
                        <Minus size={20} color={Colors.primary} strokeWidth={3} />
                      </TouchableOpacity>

                      <View className="w-12 items-center justify-center">
                        <Text className="text-lg font-black text-primary">{guestCount}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => onSetGuestCount(dateKey, guestCount + 1)}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-primary border border-primary shadow-sm"
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
