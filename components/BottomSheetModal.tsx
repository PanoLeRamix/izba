import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { LAYOUT } from '../constants/Layout';

const IS_WEB = Platform.OS === 'web';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
}

export const BottomSheetModal = ({ visible, onClose, header, children }: BottomSheetModalProps) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [shouldRender, setShouldRender] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      dragY.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: LAYOUT.MODAL_ANIM_DURATION,
        useNativeDriver: !IS_WEB,
      }).start();
      return;
    }

    Animated.timing(animValue, {
      toValue: 0,
      duration: LAYOUT.MODAL_ANIM_DURATION - 50,
      useNativeDriver: !IS_WEB,
    }).start(() => {
      setShouldRender(false);
      dragY.setValue(0);
    });
  }, [animValue, dragY, visible]);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_event, gestureState) => {
        dragY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dy > LAYOUT.MODAL_SWIPE_THRESHOLD || gestureState.vy > LAYOUT.MODAL_VELOCITY_THRESHOLD) {
          onClose();
          return;
        }

        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: !IS_WEB,
          tension: 40,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: !IS_WEB,
          tension: 40,
          friction: 8,
        }).start();
      },
    }),
  ).current;

  if (!shouldRender && !visible) {
    return null;
  }

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });
  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible={shouldRender || visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.backdrop, opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <View style={styles.contentContainer} pointerEvents="box-none">
          <Animated.View
            {...dragResponder.panHandlers}
            style={{
              transform: [{ translateY }, { translateY: dragY }],
              paddingTop: IS_WEB ? LAYOUT.BASE_MODAL_PADDING_TOP / 2 : LAYOUT.BASE_MODAL_PADDING_TOP,
              paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_MODAL_PADDING_BOTTOM),
              paddingHorizontal: LAYOUT.BASE_MODAL_PADDING_HORIZONTAL,
              backgroundColor: Colors.hearth,
              borderTopLeftRadius: IS_WEB ? 0 : LAYOUT.MODAL_BORDER_RADIUS,
              borderTopRightRadius: IS_WEB ? 0 : LAYOUT.MODAL_BORDER_RADIUS,
              overflow: 'hidden',
              maxHeight: '90%',
            }}
            className="shadow-xl w-full max-w-2xl self-center"
          >
            {!IS_WEB ? (
              <View className="items-center mb-6 py-2">
                <View className="w-12 h-1.5 bg-forest-dark/10 rounded-full" />
              </View>
            ) : null}
            {header}
            <View style={{ paddingBottom: 20 }}>{children}</View>
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
  },
});
