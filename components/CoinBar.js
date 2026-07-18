import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { useGame } from '../lib/store';

export default function CoinBar() {
  const { state } = useGame();
  return (
    <View style={styles.bar}>
      <View style={styles.pill}>
        <Image source={require('../assets/mascots/currency.png')} style={styles.icon} resizeMode="contain" />
        <Text style={styles.value}>{state.coins}</Text>
      </View>
      <View style={styles.pill}>
        <Feather name="zap" size={16} color={colors.streakFlame} />
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
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  icon: {
    width: 18,
    height: 18,
  },
  value: {
    ...typography.body,
    fontWeight: '700',
  },
});
