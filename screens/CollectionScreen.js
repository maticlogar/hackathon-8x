import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius, rarityColors } from '../lib/theme';
import wordpool from '../content/wordpool.json';
import { getLanguage } from '../content/languages';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export default function CollectionScreen({ onBack }) {
  const { state } = useGame();
  const ownedIds = new Set(state.collection.map((item) => item.id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backRow}>
          <Feather name="chevron-left" size={18} color={colors.textSecondary} />
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <CoinBar />
      </View>

      <Text style={typography.title}>Collection</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        {ownedIds.size} / {wordpool.length} words caught
      </Text>

      {RARITY_ORDER.map((rarity) => {
        const items = wordpool.filter((w) => w.rarity === rarity);
        return (
          <View key={rarity} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: rarityColors[rarity] }]}>
              {rarity.toUpperCase()}
            </Text>
            <View style={styles.grid}>
              {items.map((item) => {
                const owned = ownedIds.has(item.id);
                const lang = getLanguage(item.lang);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.card,
                      { borderColor: owned ? rarityColors[rarity] : colors.border },
                    ]}
                  >
                    {owned ? (
                      <>
                        <Text style={styles.flag}>{lang?.flag}</Text>
                        <Text style={styles.word}>{item.word}</Text>
                        <Text style={styles.meaning} numberOfLines={2}>
                          {item.meaning_en}
                        </Text>
                      </>
                    ) : (
                      <Feather name="help-circle" size={26} color={colors.textMuted} style={{ opacity: 0.5 }} />
                    )}
                  </View>
                );
              })}
            </View>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '31%',
    aspectRatio: 0.9,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  flag: {
    fontSize: 18,
  },
  word: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  meaning: {
    ...typography.caption,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
