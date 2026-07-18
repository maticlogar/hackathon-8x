import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../lib/theme';
import { CRATE_TYPES } from '../content/crates';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';

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
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Nazaj</Text>
        </Pressable>
        <CoinBar />
      </View>

      <Text style={typography.title}>Trgovina</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>Shop</Text>

      {CRATE_TYPES.map((crate) => {
        const affordable = state.coins >= crate.cost;
        return (
          <View key={crate.id} style={styles.card}>
            <Text style={styles.icon}>{crate.icon}</Text>
            <Text style={typography.heading}>{crate.name}</Text>
            <Text style={typography.caption}>{crate.nameEn}</Text>

            <View style={styles.oddsRow}>
              {Object.entries(crate.odds).map(([rarity, pct]) => (
                <Text key={rarity} style={styles.oddsText}>
                  {rarity[0].toUpperCase()}: {pct}%
                </Text>
              ))}
            </View>

            <Pressable
              disabled={!affordable}
              onPress={() => handleBuy(crate)}
              style={[styles.buyButton, !affordable && styles.buyButtonDisabled]}
            >
              <Text style={styles.buyButtonText}>🪙 {crate.cost}</Text>
            </Pressable>
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
  back: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  icon: {
    fontSize: 48,
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
  buyButton: {
    backgroundColor: colors.coinGold,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buyButtonDisabled: {
    backgroundColor: colors.border,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
});
