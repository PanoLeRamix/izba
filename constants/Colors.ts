export const Colors = {
  // Brand Colors (Harmonious Hearth Design System)
  primary: '#163526',
  primaryContainer: '#2D4C3B',
  primaryFixed: '#C7EBD4',
  
  secondary: '#556348',
  secondaryContainer: '#D9E8C7',
  secondaryFixed: '#D9E8C7',
  
  tertiary: '#462806',
  tertiaryContainer: '#603E1A',
  tertiaryFixed: '#FFDCBD',

  // Surfaces
  surface: '#FCF9F0',
  surfaceDim: '#DDDAD1',
  surfaceBright: '#FCF9F0',
  surfaceVariant: '#E5E2DA',
  
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F6F3EA',
  surfaceContainer: '#F1EEE5',
  surfaceContainerHigh: '#EBE8DF',
  surfaceContainerHighest: '#E5E2DA',

  // On-Colors (Text/Icons)
  onSurface: '#1C1C17',
  onSurfaceVariant: '#424843',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onTertiary: '#FFFFFF',
  
  // Accents & Lines
  outline: '#727973',
  outlineVariant: '#C2C8C1',

  // Legacy mappings to avoid breakage where possible, but discouraged
  forest: '#163526',
  forestDark: '#012113',
  sage: '#556348',
  hearth: '#FCF9F0',
  hearthEarth: '#462806',
  tileBackground: '#F6F3EA',
  tileBorder: 'rgba(194, 200, 193, 0.15)', // outline-variant at 15%
  
  // Status Colors
  chefOrange: '#462806', // Using tertiary for the wood feel
  status: {
    available: '#163526',
    availableBg: '#D9E8C7', // secondary-container (sage)
    availableBorder: 'rgba(194, 200, 193, 0.15)',
    unavailable: '#BA1A1A',
    unavailableBg: '#FFDAD6',
    unavailableBorder: 'rgba(194, 200, 193, 0.15)',
    none: '#92400E', // amber-800
    noneBg: '#FFFBEB', // amber-50
    noneBorder: '#FDE68A', // amber-200
  },

  // Interactions
  whiteAlpha50: 'rgba(255, 255, 255, 0.5)',
  primaryAlpha10: 'rgba(22, 53, 38, 0.1)',
  primaryAlpha5: 'rgba(22, 53, 38, 0.05)',
  blackAlpha5: 'rgba(28, 28, 23, 0.05)', // Using onSurface
  backdrop: 'rgba(28, 28, 23, 0.4)',
};
