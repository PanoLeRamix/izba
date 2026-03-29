import { Platform } from 'react-native';

export const LAYOUT = {
  HEADER_HEIGHT: 70,
  TAB_BAR_HEIGHT: 60,
  
  // Base Spacing (to be combined with Safe Area Insets)
  BASE_MODAL_PADDING_TOP: 24,
  BASE_MODAL_PADDING_BOTTOM: 24,
  BASE_MODAL_PADDING_HORIZONTAL: 32,
  BASE_SCREEN_PADDING: 24,
  BASE_SCREEN_GAP: 32,
  
  // Padding/Margins Helpers
  getTopPadding: (insetsTop: number) => insetsTop + (LAYOUT.BASE_SCREEN_PADDING / 2),
  getBottomBuffer: (insetsBottom: number) => Math.max(insetsBottom, LAYOUT.BASE_SCREEN_PADDING),
  
  // Tile Dimensions
  TILE_GAP_TOTAL: 60,
  TILE_ROWS: 7,
  getTileHeight: (availableHeight: number) => Math.floor((availableHeight - LAYOUT.TILE_GAP_TOTAL) / LAYOUT.TILE_ROWS),
  
  // Shadows
  SHADOW_TODAY: { width: 0, height: 6 },
  SHADOW_NORMAL: { width: 0, height: 1 },
  
  // Modal Constants
  MODAL_BORDER_RADIUS: 48,
  MODAL_INNER_RADIUS: 32,
  MODAL_ANIM_DURATION: 300,
  MODAL_SWIPE_THRESHOLD: 100,
  MODAL_VELOCITY_THRESHOLD: 0.5,
};
