import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../lib/theme';
import { useGame } from '../lib/store';

export default function CoinBar() {
  const { state } = useGame();
  return (
    <View style={styles.bar}>
      <View style={styles.pill}>
        <Text style={styles.icon}>🪙</Text>
        <Text style={styles.value}>{state.coins}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.icon}>🔥</Text>
        <Text style={styles.value}>{state.streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    ...typography.body,
    fontWeight: '700',
  },
});
