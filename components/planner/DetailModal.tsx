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
import { XCircle, Minus, Plus, MessageSquarePlus, MessageSquareText, Check } from 'lucide-react-native';
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
  totalEatersCount: number; // New prop to avoid the "weird formula" in the component
  cooks: User[];
  isUserCooking: boolean;
  guestCount: number;
  note: string;
  onToggleCooking: (dateKey: string) => void;
  onSetGuestCount: (dateKey: string, count: number) => void;
  onUpdateNote: (dateKey: string, content: string) => void;
  locale: any;
}

const IS_WEB = Platform.OS === 'web';

export const DetailModal = ({ 
  visible, 
  onClose, 
  date, 
  dateKey,
  eaters, 
  totalEatersCount,
  cooks,
  isUserCooking,
  guestCount,
  note,
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
      onStartShouldSetPanResponder: () => !IS_WEB && !isEditingNote,
      onMoveShouldSetPanResponder: (_, gestureState) => !IS_WEB && !isEditingNote && Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (!IS_WEB && !isEditingNote && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!IS_WEB && !isEditingNote) {
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

  const renderMemberChip = (user: User & { guestCount?: number, note?: string }) => {
    const isMe = user.id === userId;
    return (
      <View key={user.id} className="items-start mb-3 mr-2">
        <View className="relative">
          <View 
            className={`px-4 py-2 rounded-full border ${isMe ? 'bg-forest/20 border-forest/40' : 'bg-forest/5 border-forest/10'}`}
          >
            <Text className="font-bold text-forest text-sm">
              {user.name}
            </Text>
          </View>
          {user.guestCount && user.guestCount > 0 ? (
            <View 
              className="absolute -top-2 -right-2 bg-forest px-1.5 py-0.5 rounded-lg border border-white shadow-sm"
            >
              <Text className="text-[10px] text-white font-black">
                +{user.guestCount}
              </Text>
            </View>
          ) : null}
        </View>
        {user.note ? (
          <View className="mt-1 ml-2">
            <Text className="text-forest-dark/40 italic text-[11px] leading-tight">
              "{user.note}"
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const eatersWithNotes = eaters.filter(u => !!u.note);

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
              {...(IS_WEB ? {} : panResponder.panHandlers)}
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
                <View>
                  <Text className="text-3xl font-black text-forest-dark uppercase">{t('planner.details')}</Text>
                  {date && (
                    <Text className="text-forest-light font-bold uppercase opacity-60">
                      {format(date, 'EEEE d MMMM', { locale })}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose}>
                  <XCircle size={40} color={Colors.forest} opacity={0.3} />
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
                      <Text className="text-xs font-black text-forest uppercase tracking-widest mr-2">
                        {isUserCooking ? '🍳' : '+'} {t('planner.iAmCooking')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row flex-wrap gap-2">
                    {cooks.length > 0 ? cooks.map(renderMemberChip) : (
                      <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneCooking')}</Text>
                    )}
                  </View>
                </View>

                {/* Eating Section */}
                <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center mb-4">
                    <Text className="text-2xl mr-3">🍽️</Text>
                    <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.eating')}</Text>
                    <View className="ml-2 bg-forest/10 px-2.5 py-0.5 rounded-full">
                      <Text className="text-forest text-xs font-black">{totalEatersCount}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row flex-wrap gap-2">
                    {eaters.length > 0 ? eaters.map(renderMemberChip) : (
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

                {/* Comments Section */}
                <View className="bg-white rounded-[32px] p-6 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">💬</Text>
                      <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.myNote')}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => setIsEditingNote(true)}
                      className={`flex-row items-center px-4 py-2 rounded-xl border ${note ? 'bg-forest/10 border-forest/30' : 'bg-sage-light/10 border-sage/20'}`}
                    >
                      {note ? <MessageSquareText size={16} color={Colors.forest} className="mr-2" /> : <MessageSquarePlus size={16} color={Colors.forest} className="mr-2" />}
                      <Text className="text-xs font-black text-forest uppercase tracking-widest">
                        {note ? t('planner.editNote') : t('planner.addNote')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View>
                    {eatersWithNotes.map((u) => (
                      <View key={`note-${u.id}`} className="mb-3 last:mb-0">
                        <Text className="text-[10px] font-black text-forest-dark uppercase opacity-40 mb-1">{u.name}</Text>
                        <View className={`p-3 rounded-2xl ${u.id === userId ? 'bg-forest/5 border border-forest/10' : 'bg-sage-light/5 border border-sage/10'}`}>
                          <Text className="text-forest-dark text-sm font-medium italic">"{u.note}"</Text>
                        </View>
                      </View>
                    ))}
                    
                    {eatersWithNotes.length === 0 && (
                      <Text className="text-forest-dark/40 italic font-medium">{t('planner.noComments')}</Text>
                    )}
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

              <View className="bg-white rounded-3xl p-4 border border-forest/30 shadow-inner mb-6">
                <TextInput
                  autoFocus={true}
                  value={tempNote}
                  onChangeText={(text) => setTempNote(text.replace(/\n/g, ''))}
                  placeholder={t('planner.notePlaceholder')}
                  placeholderTextColor="rgba(27, 54, 23, 0.3)"
                  className="text-forest-dark font-medium text-lg min-h-[60px]"
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveNote}
                />
              </View>

              <TouchableOpacity 
                onPress={handleSaveNote}
                className="bg-forest py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
              >
                <Check size={24} color="white" strokeWidth={4} className="mr-2" />
                <Text className="text-white font-black uppercase tracking-widest text-lg">
                  {t('save')}
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
