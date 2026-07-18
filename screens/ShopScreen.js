import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { CRATE_TYPES } from '../content/crates';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';
import TactileButton from '../components/TactileButton';

export default function ShopScreen({ onBack, onBuyCrate }) {
  const { state, dispatch } = useGame();

  const handleBuy = (crate) => {
    if (state.coins < crate.cost) return;
    dispatch({ type: 'SPEND_COINS', amount: crate.cost });
    onBuyCrate(crate.id);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backRow}>
          <Feather name="chevron-left" size={18} color={colors.textSecondary} />
          <Text style={styles.back}>Nazaj</Text>
        </Pressable>
        <CoinBar />
      </View>

      <Text style={typography.title}>Trgovina</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>Shop</Text>

      {CRATE_TYPES.map((crate) => {
        const affordable = state.coins >= crate.cost;
        return (
          <View key={crate.id} style={styles.card}>
            <Image source={crate.image} style={styles.icon} resizeMode="contain" />
            <Text style={typography.heading}>{crate.name}</Text>
            <Text style={typography.caption}>{crate.nameEn}</Text>

            <View style={styles.oddsRow}>
              {Object.entries(crate.odds).map(([rarity, pct]) => (
                <Text key={rarity} style={styles.oddsText}>
                  {rarity[0].toUpperCase()}: {pct}%
                </Text>
              ))}
            </View>

            <TactileButton
              disabled={!affordable}
              onPress={() => handleBuy(crate)}
              backgroundColor={affordable ? colors.coinGold : colors.lockedBg}
              borderRadius={radius.pill}
              contentStyle={styles.buyButtonContent}
            >
              <View style={styles.buyButtonRow}>
                <Image source={require('../assets/mascots/currency.png')} style={styles.buyButtonIcon} resizeMode="contain" />
                <Text style={styles.buyButtonText}>{crate.cost}</Text>
              </View>
            </TactileButton>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  back: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  icon: {
    width: 72,
    height: 72,
    marginBottom: spacing.xs,
  },
  oddsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  oddsText: {
    ...typography.caption,
    fontSize: 11,
  },
  buyButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buyButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyButtonIcon: {
    width: 18,
    height: 18,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
});
