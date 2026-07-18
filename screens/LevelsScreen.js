import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../lib/theme';
import { getLanguage } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';

const ZIGZAG_ALIGN = ['flex-start', 'center', 'flex-end', 'center'];

export default function LevelsScreen({ langId, onBack, onSelectLevel }) {
  const { state } = useGame();
  const lang = getLanguage(langId);
  const levels = getLevelsForLanguage(langId);
  const unlockedLevel = state.progress[langId]?.unlockedLevel ?? 1;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Nazaj</Text>
        </Pressable>
        <CoinBar />
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.flag}>{lang.flag}</Text>
        <View>
          <Text style={typography.title}>{lang.name}</Text>
          <Text style={typography.caption}>{levels.length} levels</Text>
        </View>
      </View>

      <View style={styles.trail}>
        {levels.map((lvl, i) => {
          const isLocked = lvl.level > unlockedLevel;
          const isCompleted = lvl.level < unlockedLevel;
          return (
            <View
              key={lvl.level}
              style={[styles.nodeRow, { alignItems: ZIGZAG_ALIGN[i % ZIGZAG_ALIGN.length] }]}
            >
              <Pressable
                disabled={isLocked}
                onPress={() => onSelectLevel(lvl.level)}
                style={({ pressed }) => [
                  styles.node,
                  {
                    backgroundColor: isLocked ? colors.card : lang.accent,
                    borderColor: isLocked ? colors.border : lang.accentSecondary,
                  },
                  pressed && !isLocked && styles.nodePressed,
                ]}
              >
                {isLocked ? (
                  <Text style={styles.nodeLock}>🔒</Text>
                ) : isCompleted ? (
                  <Text style={styles.nodeCheck}>✓</Text>
                ) : (
                  <Text style={styles.nodeNumber}>{lvl.level}</Text>
                )}
              </Pressable>
              <Text style={styles.nodeLabel}>{lvl.words.length} words</Text>
            </View>
          );
        })}
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
  back: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  flag: {
    fontSize: 40,
  },
  trail: {
    gap: spacing.lg,
  },
  nodeRow: {
    width: '100%',
  },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePressed: {
    opacity: 0.75,
  },
  nodeNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#141416',
  },
  nodeCheck: {
    fontSize: 28,
    fontWeight: '800',
    color: '#141416',
  },
  nodeLock: {
    fontSize: 22,
  },
  nodeLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
