import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { LANGUAGES } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { useGame } from '../lib/store';
import DottedBackground from '../components/DottedBackground';
import TactileButton from '../components/TactileButton';
import SettingsModal from '../components/SettingsModal';

const firstUnlocked = LANGUAGES.find((l) => !l.locked)?.id ?? LANGUAGES[0].id;

// Chilli rating: how brutal a language's slang gets.
function HeatRow({ count }) {
  return (
    <View style={styles.heatRow}>
      {Array.from({ length: count }, (_, i) => (
        <MaterialCommunityIcons key={i} name="chili-hot" size={17} color={colors.primary} />
      ))}
    </View>
  );
}

export default function LanguagesScreen({ onSelectLanguage }) {
  const { state } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(firstUnlocked);
  const [requested, setRequested] = useState(false);

  // Fraction of all levels across all languages that have been unlocked.
  let total = 0;
  let done = 0;
  LANGUAGES.forEach((l) => {
    const count = getLevelsForLanguage(l.id).length;
    total += count;
    done += Math.min(count, (state.progress[l.id]?.unlockedLevel ?? 1) - 1);
  });
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <View style={styles.screen}>
      <DottedBackground />
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TactileButton
            onPress={() => setSettingsVisible(true)}
            backgroundColor={colors.bgElevated}
            borderRadius={radius.md}
            depth={4}
            contentStyle={styles.gearFace}
          >
            <Feather name="settings" size={22} color={colors.textPrimary} />
          </TactileButton>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, progress)}%` }]} />
          </View>
        </View>

        <Text style={styles.title}>PICK YOUR POISON</Text>
        <Text style={styles.subtitle}>every language, the way locals actually speak it</Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const selected = lang.id === selectedId;
            return (
              <TactileButton
                key={lang.id}
                onPress={() => setSelectedId(lang.id)}
                disabled={lang.locked}
                backgroundColor={selected ? colors.primarySelectedBg : colors.bgElevated}
                shadowColor={selected ? colors.primaryShadowSoft : colors.border}
                borderColor={selected ? colors.primary : colors.border}
                borderRadius={20}
                depth={4}
                contentStyle={styles.cardFace}
              >
                <View style={styles.cardText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.langName}>{lang.nameEn.toUpperCase()}</Text>
                    <HeatRow count={lang.heat} />
                  </View>
                  {lang.locked ? (
                    <Text style={styles.tagline}>coming soon</Text>
                  ) : (
                    <Text style={[styles.tagline, selected && styles.taglineSelected]}>
                      {lang.tagline}
                    </Text>
                  )}
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <Feather name="check" size={19} color={colors.onPrimary} />}
                </View>
              </TactileButton>
            );
          })}

          <Pressable style={styles.ghostCard} onPress={() => setRequested(true)}>
            <Text style={styles.ghostText}>
              {requested ? 'noted — more on the way' : '+ request a language'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TactileButton
          onPress={() => onSelectLanguage(selectedId)}
          backgroundColor={colors.primary}
          shadowColor={colors.primaryShadowSoft}
          borderRadius={20}
          depth={6}
          style={styles.ctaWrap}
          contentStyle={styles.ctaFace}
        >
          <Text style={styles.ctaText}>LET'S SWEAR</Text>
          <MaterialCommunityIcons name="fire" size={22} color={colors.onPrimary} />
        </TactileButton>
        <Text style={styles.footerNote}>you can add more languages later</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPaper,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  gearFace: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
    borderRightWidth: 2,
    borderRightColor: colors.border,
    borderRadius: radius.pill,
  },
  title: {
    ...typography.display,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  cardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cardText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  langName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  heatRow: {
    flexDirection: 'row',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  taglineSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioSelected: {
    backgroundColor: colors.primary,
  },
  ghostCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    borderRadius: 20,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ghostText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgPaper,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  ctaWrap: {
    width: '100%',
  },
  ctaFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: colors.onPrimary,
  },
  footerNote: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.8,
  },
});
