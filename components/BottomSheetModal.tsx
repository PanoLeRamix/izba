import React, { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { LAYOUT } from '../constants/Layout';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
}

export const BottomSheetModal = ({ visible, onClose, header, children }: BottomSheetModalProps) => {
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<GorhomBottomSheetModal>(null);

  // We use a dynamic snap point that fits the content, up to 90% of the screen.
  const snapPoints = useMemo(() => ['90%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop 
        {...props} 
        disappearsOnIndex={-1} 
        appearsOnIndex={0} 
        opacity={0.4} // Consistent with Colors.backdrop
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: Colors.hearth,
        borderTopLeftRadius: LAYOUT.MODAL_BORDER_RADIUS,
        borderTopRightRadius: LAYOUT.MODAL_BORDER_RADIUS,
      }}
      handleIndicatorStyle={{
        backgroundColor: Colors.forest + '33',
        width: 48,
        height: 6,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_MODAL_PADDING_BOTTOM),
          paddingHorizontal: LAYOUT.BASE_MODAL_PADDING_HORIZONTAL,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        <View style={{ paddingBottom: 20 }}>{children}</View>
      </BottomSheetScrollView>
    </GorhomBottomSheetModal>
  );
};
