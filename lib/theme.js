// Deadpan-clinical gamified theme: dark chrome, bold flag-colored accents.
export const colors = {
  bg: '#141416',
  bgElevated: '#1e1f23',
  card: '#232428',
  border: '#33343a',
  textPrimary: '#f2f2f0',
  textSecondary: '#9a9ba3',
  textMuted: '#5f606a',
  coinGold: '#ffc93c',
  streakFlame: '#ff6b35',
  success: '#3ddc84',
  danger: '#ff4d4d',
  lockedOverlay: 'rgba(0,0,0,0.55)',
};

export const rarityColors = {
  common: '#9a9ba3',
  uncommon: '#3ddc84',
  rare: '#3c9dff',
  epic: '#b46bff',
  legendary: '#ffc93c',
};

export const severityColor = (severity) => {
  if (severity <= 1) return '#3ddc84';
  if (severity === 2) return '#ffd93c';
  if (severity === 3) return '#ff9f3c';
  if (severity === 4) return '#ff6b35';
  return '#ff3c3c';
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const typography = {
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  heading: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
};
