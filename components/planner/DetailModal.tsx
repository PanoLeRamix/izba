import React, { useEffect, useRef } from 'react';
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
  StyleSheet
} from 'react-native';
import { format } from 'date-fns';
import { XCircle, Check, ChefHat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { User } from '../../services/user';
import { useAuthStore } from '../../store/authStore';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  dateKey: string;
  eaters: User[];
  cooks: User[];
  isUserCooking: boolean;
  onToggleCooking: (dateKey: string) => void;
  locale: any;
}

const IS_WEB = Platform.OS === 'web';

export const DetailModal = ({ 
  visible, 
  onClose, 
  date, 
  dateKey,
  eaters, 
  cooks,
  isUserCooking,
  onToggleCooking,
  locale 
}: DetailModalProps) => {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const { height: screenHeight } = useWindowDimensions();
  const [shouldRender, setShouldRender] = React.useState(visible);
  
  const animValue = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      panY.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: !IS_WEB,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: !IS_WEB,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !IS_WEB,
      onMoveShouldSetPanResponder: (_, gestureState) => !IS_WEB && Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (!IS_WEB && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!IS_WEB) {
          if (gestureState.dy > 100 || gestureState.vy > 0.5) {
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

  const renderMemberChip = (user: User) => {
    const isMe = user.id === userId;
    return (
      <View 
        key={user.id} 
        className={`px-4 py-2 rounded-full border ${isMe ? 'bg-forest/20 border-forest/40' : 'bg-forest/5 border-forest/10'}`}
      >
        <Text className="font-bold text-forest text-sm">
          {user.name}{isMe ? ` (${t('common.today').toLowerCase()})` : ''}
        </Text>
      </View>
    );
  };

  return (
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
              paddingTop: IS_WEB ? 10 : 32,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
              backgroundColor: '#F9F7F2', 
              borderTopLeftRadius: IS_WEB ? 0 : 48,
              borderTopRightRadius: IS_WEB ? 0 : 48,
              overflow: 'hidden',
            }}
            className="px-8 pt-12 pb-12 shadow-xl w-full max-w-2xl self-center"
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
                <XCircle size={40} color="#2D5A27" opacity={0.3} />
              </TouchableOpacity>
            </View>

            {/* Cooking Section */}
            <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm">
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
              
              {cooks.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {cooks.map(renderMemberChip)}
                </View>
              ) : (
                <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneCooking')}</Text>
              )}
            </View>

            {/* Eating Section */}
            <View className="bg-white rounded-[32px] p-6 border border-sage-light/30 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Text className="text-2xl mr-3">🍽️</Text>
                <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('planner.eating')}</Text>
                <View className="ml-2 bg-forest/10 px-2.5 py-0.5 rounded-full">
                  <Text className="text-forest text-xs font-black">{eaters.length}</Text>
                </View>
              </View>
              
              {eaters.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {eaters.map(renderMemberChip)}
                </View>
              ) : (
                <Text className="text-forest-dark/40 italic font-medium">{t('planner.noOneEating')}</Text>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
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
