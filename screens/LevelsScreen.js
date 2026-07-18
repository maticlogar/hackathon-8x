import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { getLanguage } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';
import TactileButton from '../components/TactileButton';

// Winding S-curve offsets, alternating side to side down the trail.
const WIGGLE = [40, -40, 15, -55, 25, -30];
const CHEST_AFTER_LEVEL = 1;

export default function LevelsScreen({ langId, onBack, onSelectLevel, onOpenShop }) {
  const { state } = useGame();
  const lang = getLanguage(langId);
  const levels = getLevelsForLanguage(langId);
  const unlockedLevel = state.progress[langId]?.unlockedLevel ?? 1;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backRow}>
          <Feather name="chevron-left" size={18} color={colors.textSecondary} />
          <Text style={styles.back}>Nazaj</Text>
        </Pressable>
        <CoinBar />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerWatermark}>{lang.flag}</Text>
        <View>
          <Text style={styles.bannerLabel}>1. POGLAVJE · CHAPTER 1</Text>
          <Text style={styles.bannerTitle}>{lang.name}</Text>
          <Text style={styles.bannerSubtitle}>{levels.length} levels · {lang.nameEn}</Text>
        </View>
      </View>

      <View style={styles.trail}>
        {levels.map((lvl, i) => {
          const isLocked = lvl.level > unlockedLevel;
          const isCompleted = lvl.level < unlockedLevel;
          const isCurrent = lvl.level === unlockedLevel;
          const offset = WIGGLE[i % WIGGLE.length];

          let bg = colors.lockedBg;
          if (isCompleted) bg = colors.secondaryContainer;
          if (isCurrent) bg = colors.primary;

          return (
            <View key={lvl.level}>
              <View style={[styles.nodeRow, { transform: [{ translateX: offset }] }]}>
                {isCurrent && (
                  <Image
                    source={require('../assets/mascots/app-mascot.png')}
                    style={styles.mascot}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.nodeStack}>
                  <TactileButton
                    onPress={() => onSelectLevel(lvl.level)}
                    disabled={isLocked}
                    backgroundColor={bg}
                    borderRadius={isCurrent ? 44 : 36}
                    style={{ width: isCurrent ? 88 : 72 }}
                    contentStyle={{
                      width: isCurrent ? 88 : 72,
                      height: isCurrent ? 88 : 72,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isLocked ? (
                      <Feather name="lock" size={22} color={colors.textMuted} />
                    ) : isCompleted ? (
                      <Feather name="check" size={28} color={colors.onSecondaryContainer} />
                    ) : isCurrent ? (
                      <Feather name="play" size={30} color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.nodeNumber}>{lvl.level}</Text>
                    )}
                  </TactileButton>
                  {isCurrent && (
                    <View style={styles.starRow}>
                      <Image source={require('../assets/mascots/star-no.png')} style={styles.star} resizeMode="contain" />
                      <Image source={require('../assets/mascots/star-no.png')} style={styles.star} resizeMode="contain" />
                      <Image source={require('../assets/mascots/star-no.png')} style={styles.star} resizeMode="contain" />
                    </View>
                  )}
                  <Text style={styles.nodeLabel}>{lvl.words.length} words</Text>
                </View>
              </View>

              {lvl.level === CHEST_AFTER_LEVEL && (
                <View style={[styles.nodeRow, { transform: [{ translateX: -offset }] }]}>
                  <Pressable onPress={onOpenShop} style={styles.chestWrap}>
                    <Image
                      source={require('../assets/mascots/chest-basic.png')}
                      style={styles.chestImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>Kmalu več besed</Text>
        <View style={styles.footerLine} />
      </View>
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
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  bannerWatermark: {
    position: 'absolute',
    right: -10,
    top: -10,
    fontSize: 90,
    opacity: 0.18,
    transform: [{ rotate: '12deg' }],
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFE9E7',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFE9E7',
  },
  trail: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeStack: {
    alignItems: 'center',
  },
  mascot: {
    width: 52,
    height: 52,
    marginRight: -8,
  },
  nodeNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs,
  },
  star: {
    width: 20,
    height: 20,
  },
  nodeLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  chestWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestImage: {
    width: 68,
    height: 68,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  footerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    opacity: 0.15,
  },
  footerText: {
    ...typography.heading,
    fontSize: 15,
    color: colors.textMuted,
  },
});
