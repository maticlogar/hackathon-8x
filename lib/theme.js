// Tactile, cream-and-red gamified theme: thick borders, chunky drop-shadow
// buttons that press down on tap. Light background, bold saturated accents.
export const colors = {
  bg: '#FCF9F8',
  bgPaper: '#FAF6F0',
  bgDot: '#D1CFCD',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  surfaceContainer: '#F0EDED',
  surfaceContainerHigh: '#EAE7E7',
  border: '#1C1B1B',
  outline: '#916F6A',
  outlineVariant: '#E5BDB8',

  textPrimary: '#1C1B1B',
  textSecondary: '#5C403C',
  textMuted: '#916F6A',

  primary: '#BA0A0D',
  primaryContainer: '#DE2D24',
  onPrimary: '#FFFFFF',
  primaryShadow: '#5A0002',
  primaryShadowSoft: '#930005',
  primarySelectedBg: '#FFF1F0',

  secondaryContainer: '#FD8B00',
  onSecondaryContainer: '#603100',
  secondaryShadow: '#2F1500',

  tertiaryContainer: '#FFE16D',
  onTertiaryContainer: '#4C3F00',
  tertiaryShadow: '#544600',

  coinGold: '#C9A900',
  streakFlame: '#FD8B00',
  success: '#2E9E44',
  successShadow: '#0F4A1C',
  danger: '#BA1A1A',
  dangerShadow: '#5A0002',

  lockedBg: '#E5E2E1',
  lockedOverlay: 'rgba(28,27,27,0.55)',
};

export const rarityColors = {
  common: '#8A8783',
  uncommon: '#2E9E44',
  rare: '#2E6FDE',
  epic: '#9C3FDE',
  legendary: '#C9A900',
};

export const severityColor = (severity) => {
  if (severity <= 1) return '#2E9E44';
  if (severity === 2) return '#C9A900';
  if (severity === 3) return '#FD8B00';
  if (severity === 4) return '#E05A1E';
  return '#BA0A0D';
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

// Depth (px) for the tactile press-down effect, and the matching shadow
// color for each solid background it's used against.
export const tactile = {
  depth: 5,
  shadowFor: {
    [colors.primaryContainer]: colors.primaryShadow,
    [colors.primary]: colors.primaryShadow,
    [colors.secondaryContainer]: colors.secondaryShadow,
    [colors.tertiaryContainer]: colors.tertiaryShadow,
    [colors.success]: colors.successShadow,
    [colors.danger]: colors.dangerShadow,
    [colors.card]: colors.border,
    [colors.bgElevated]: colors.border,
    [colors.lockedBg]: colors.outline,
  },
};

export const typography = {
  display: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.6 },
  title: { fontSize: 26, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8 },
};
