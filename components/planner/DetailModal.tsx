import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  Platform, 
  Animated, 
  PanResponder, 
  useWindowDimensions,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { XCircle, Minus, Plus, MessageSquarePlus, MessageSquareText, Check, X, ChefHat, Hand } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { User } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  dateKey: string;
  eaters: (User & { guestCount?: number, note?: string })[];
  unavailable: User[];
  totalEatersCount: number;
  cooks: User[];
  isUserCooking: boolean;
  guestCount: number;
  note: string;
  status: string;
  onToggleStatus: (dateKey: string) => void;
  onToggleCooking: (dateKey: string) => void;
  onSetGuestCount: (dateKey: string, count: number) => void;
  onUpdateNote: (dateKey: string, content: string) => void;
  locale: any;
}

const IS_WEB = Platform.OS === 'web';
const MAX_NOTE_LENGTH = 20;

export const DetailModal = ({ 
  visible, 
  onClose, 
  date, 
  dateKey,
  eaters, 
  unavailable = [],
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
  locale 
}: DetailModalProps) => {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [shouldRender, setShouldRender] = useState(visible);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(note);
  
  const animValue = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setTempNote(note);
      panY.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: LAYOUT.MODAL_ANIM_DURATION,
        useNativeDriver: !IS_WEB,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: LAYOUT.MODAL_ANIM_DURATION - 50,
        useNativeDriver: !IS_WEB,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, note]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isEditingNote,
      onMoveShouldSetPanResponder: (_, gestureState) => !isEditingNote && Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (!isEditingNote && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isEditingNote) {
          if (gestureState.dy > LAYOUT.MODAL_SWIPE_THRESHOLD || gestureState.vy > LAYOUT.MODAL_VELOCITY_THRESHOLD) {
            onClose();
          } else {
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: !IS_WEB,
              tension: 40,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;

  if (!shouldRender && !visible) return null;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });
  
  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderMemberChip = (user: User & { guestCount?: number, note?: string }, variant: 'eating' | 'unavailable' | 'cooking' = 'eating') => {
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
    }

    return (
      <View key={`${variant}-${user.id}`} className={`items-start ${user.note ? 'mb-5' : ''}`}>
        <View className="relative">
          <View 
            className={`px-4 py-2 rounded-full border ${bgColor} ${borderColor}`}
          >
            <Text className={`font-bold text-sm ${textColor} ${variant === 'unavailable' ? 'line-through opacity-70' : ''}`}>
              {user.name}
            </Text>
          </View>
          
          {user.guestCount && user.guestCount > 0 ? (
            <View 
              className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-lg border border-white shadow-sm z-20 ${chipBg} ${chipBorder}`}
            >
              <Text className="text-[10px] text-white font-black">
                +{user.guestCount}
              </Text>
            </View>
          ) : null}
          
          {user.note ? (
            <View 
              className={`absolute top-[90%] right-0 px-2 py-1 rounded-xl border border-white shadow-sm z-10 ${chipBg} ${chipBorder}`}
              style={{ minWidth: 40, maxWidth: 110 }}
            >
              <Text className="text-white text-[9px] font-bold italic leading-tight" numberOfLines={2}>
                {user.note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };
// ... (rest of the file logic around rendering these chips)


  const handleSaveNote = () => {
    onUpdateNote(dateKey, tempNote.replace(/\n/g, ' '));
    setIsEditingNote(false);
  };

  return (
    <React.Fragment>
      <Modal
        visible={shouldRender || visible}
        transparent={true}
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                { 
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  opacity: backdropOpacity 
                }
              ]} 
            />
          </TouchableWithoutFeedback>

          <View style={styles.contentContainer} pointerEvents="box-none">
            <Animated.View
              {...panResponder.panHandlers}
              style={{ 
                transform: [
                  { translateY: translateY },
                  { translateY: panY }
                ],
                paddingTop: IS_WEB ? LAYOUT.BASE_MODAL_PADDING_TOP / 2 : LAYOUT.BASE_MODAL_PADDING_TOP,
                paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_MODAL_PADDING_BOTTOM),
                paddingHorizontal: LAYOUT.BASE_MODAL_PADDING_HORIZONTAL,
                backgroundColor: Colors.hearth, 
                borderTopLeftRadius: IS_WEB ? 0 : LAYOUT.MODAL_BORDER_RADIUS,
                borderTopRightRadius: IS_WEB ? 0 : LAYOUT.MODAL_BORDER_RADIUS,
                overflow: 'hidden',
                maxHeight: '90%'
              }}
              className="shadow-xl w-full max-w-2xl self-center"
            >
              {!IS_WEB && (
                <View className="w-12 h-1.5 bg-forest-dark/10 rounded-full self-center mb-6" />
              )}

              <View className="flex-row items-center justify-between mb-8">
                <View className="flex-1 mr-2">
                  {date && (
                    <Text className="text-3xl font-black text-forest-dark uppercase leading-tight">
                      {format(date, 'EEE', { locale })}
                      {"\n"}
                      {format(date, 'd MMMM', { locale })}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  onPress={() => onToggleStatus(dateKey)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: status === 'available' ? Colors.status.availableBg : status === 'unavailable' ? Colors.status.unavailableBg : Colors.status.noneBg,
                    borderColor: status === 'available' ? Colors.status.availableBorder : status === 'unavailable' ? Colors.status.unavailableBorder : Colors.status.noneBorder,
                  }}
                  className="px-5 py-3 items-center justify-center rounded-2xl border shadow-sm"
                >
                  <Text 
                    className="font-black uppercase tracking-widest text-[10px]" 
                    style={{ color: status === 'available' ? Colors.status.available : status === 'unavailable' ? Colors.status.unavailable : Colors.status.none }}
                  >
                    {t(`planner.status.${status}`)}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Cooking Section */}
                <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">🧑‍🍳</Text>
                      <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.cooking')}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => onToggleCooking(dateKey)}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${isUserCooking ? 'bg-forest/10 border-forest/30' : 'bg-sage-light/10 border-sage/20'}`}
                    >
                      {isUserCooking ? (
                        <ChefHat size={18} color={Colors.forest} strokeWidth={2.5} />
                      ) : (
                        <Hand size={18} color={Colors.forest} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row flex-wrap gap-x-3 gap-y-2">
                    {cooks.length > 0 ? cooks.map(u => renderMemberChip(u, 'cooking')) : (
                      <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneCooking')}</Text>
                    )}
                  </View>
                </View>

                {/* Eating Section */}
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
                    {eaters.length > 0 || unavailable.length > 0 ? (
                      <>
                        {eaters.map(u => renderMemberChip(u, 'eating'))}
                        {unavailable.length > 0 && (
                          <View className="w-full mt-2 pt-2 border-t border-red-100 flex-row flex-wrap gap-x-3 gap-y-2">
                            {unavailable.map(u => renderMemberChip(u, 'unavailable'))}
                          </View>
                        )}
                      </>
                    ) : (
                      <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneEating')}</Text>
                    )}
                  </View>
                </View>

                {/* Invite Friends Section */}
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
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* Note Editing Popup */}
      <Modal
        visible={isEditingNote}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditingNote(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center bg-black/60 px-6">
            <View className="bg-hearth w-full rounded-[40px] p-8 shadow-2xl" style={{ backgroundColor: Colors.hearth }}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-black text-forest-dark uppercase">{t('planner.editNote')}</Text>
                <TouchableOpacity onPress={() => setIsEditingNote(false)}>
                  <XCircle size={32} color={Colors.forest} opacity={0.3} />
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-3xl p-4 border border-forest/30 shadow-inner mb-2">
                <TextInput
                  autoFocus={true}
                  value={tempNote}
                  onChangeText={(text) => setTempNote(text.replace(/\n/g, '').slice(0, MAX_NOTE_LENGTH))}
                  placeholder={t('planner.notePlaceholder')}
                  placeholderTextColor="rgba(27, 54, 23, 0.3)"
                  className="text-forest-dark font-medium text-lg min-h-[60px]"
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveNote}
                  maxLength={MAX_NOTE_LENGTH}
                />
              </View>
              
              <View className="flex-row justify-end mb-6 px-4">
                <Text className={`text-xs font-bold ${tempNote.length >= MAX_NOTE_LENGTH ? 'text-red-500' : 'text-forest-dark/40'}`}>
                  {tempNote.length} / {MAX_NOTE_LENGTH}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={handleSaveNote}
                className="bg-forest py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
              >
                <Check size={24} color="white" strokeWidth={4} className="mr-2" />
                <Text className="text-white font-black uppercase tracking-widest text-lg">
                  {t('auth.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  }
});
