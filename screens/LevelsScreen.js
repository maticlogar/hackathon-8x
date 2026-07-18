import { useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { getLanguage } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { useGame } from '../lib/store';
import CoinBar from '../components/CoinBar';
import DottedBackground from '../components/DottedBackground';
import TactileButton from '../components/TactileButton';

// Winding S-curve offsets, alternating side to side down the trail.
const WIGGLE = [-52, 60, -18, -58, 40, -44, 56];
const CHEST_AFTER_LEVEL = 1;
const NODE_SIZE = 76;
const CURRENT_NODE_SIZE = 96;
// Completed nodes alternate yellow/orange so the finished trail reads as a streak.
const COMPLETED_COLORS = [colors.tertiaryContainer, colors.secondaryContainer];

const CONNECTOR_HEIGHT = 92;
const DOT_SIZE = 7;
const DOT_SPACING = 19;
// Blank space left at both ends so the dots don't crowd the node borders.
const DOT_TRIM = 16;

// Dot positions along a cubic bezier running from one node centre to the next.
// The control points sit straight above/below the endpoints, so consecutive
// segments leave and enter each node vertically and read as one flowing path.
const dotCache = new Map();
function dotsBetween(fromX, toX) {
  const key = `${fromX}:${toX}`;
  const cached = dotCache.get(key);
  if (cached) return cached;

  const H = CONNECTOR_HEIGHT;
  const samples = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const u = 1 - t;
    samples.push({
      x: (u * u * u + 3 * u * u * t) * fromX + (3 * u * t * t + t * t * t) * toX,
      y: 3 * u * u * t * (H * 0.4) + 3 * u * t * t * (H * 0.6) + t * t * t * H,
    });
  }

  // Walk the sampled curve by arc length so the dots stay evenly spaced even
  // where the curve bends hardest.
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) {
    lengths.push(
      lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y)
    );
  }
  const total = lengths[lengths.length - 1];

  const dots = [];
  let cursor = 0;
  for (let d = DOT_TRIM; d <= total - DOT_TRIM; d += DOT_SPACING) {
    while (cursor < lengths.length - 1 && lengths[cursor] < d) cursor++;
    dots.push(samples[cursor]);
  }

  dotCache.set(key, dots);
  return dots;
}

function TrailConnector({ fromX, toX }) {
  return (
    <View style={styles.connector} pointerEvents="none">
      {dotsBetween(fromX, toX).map((p, i) => (
        <View
          key={i}
          style={[
            styles.connectorDot,
            { top: p.y - DOT_SIZE / 2, transform: [{ translateX: p.x - DOT_SIZE / 2 }] },
          ]}
        />
      ))}
    </View>
  );
}

export default function LevelsScreen({ langId, onBack, onSelectLevel, onOpenShop }) {
  const { state } = useGame();
  const lang = getLanguage(langId);
  const levels = getLevelsForLanguage(langId);
  const unlockedLevel = state.progress[langId]?.unlockedLevel ?? 1;

  const scrollRef = useRef(null);
  const trailY = useRef(0);
  const currentY = useRef(0);

  const scrollToCurrent = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, trailY.current + currentY.current - 120),
      animated: true,
    });
  };

  // Flatten levels + the shop chest into one ordered list of trail stops so the
  // connectors can be drawn between whatever two stops happen to be adjacent.
  const stops = [];
  levels.forEach((lvl, i) => {
    stops.push({ kind: 'level', key: `lvl-${lvl.level}`, x: WIGGLE[i % WIGGLE.length], lvl });
    if (lvl.level === CHEST_AFTER_LEVEL) {
      stops.push({ kind: 'chest', key: `chest-${lvl.level}`, x: WIGGLE[(i + 2) % WIGGLE.length] });
    }
  });

  const hasCurrent = unlockedLevel <= levels.length;

  return (
    <View style={styles.screen}>
      <DottedBackground />

      <View style={styles.appBar}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </Pressable>
        <CoinBar />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.bannerWrap}>
          <View style={styles.bannerShadow} />
          <View style={styles.banner}>
            <Text style={styles.bannerWatermark}>{lang.flag}</Text>
            <Text style={styles.bannerLabel}>
              CHAPTER 1 · {levels.length} LEVEL{levels.length === 1 ? '' : 'S'}
            </Text>
            <Text style={styles.bannerTitle}>{lang.nameEn}</Text>
          </View>
        </View>

        <View style={styles.trail} onLayout={(e) => (trailY.current = e.nativeEvent.layout.y)}>
          {stops.map((stop, i) => {
            const prev = stops[i - 1];
            const connector =
              prev != null ? <TrailConnector fromX={prev.x} toX={stop.x} /> : null;

            if (stop.kind === 'chest') {
              return (
                <View key={stop.key}>
                  {connector}
                  <View style={[styles.nodeRow, { transform: [{ translateX: stop.x }] }]}>
                    <TactileButton
                      onPress={onOpenShop}
                      backgroundColor={colors.bgElevated}
                      shadowColor={colors.border}
                      borderRadius={NODE_SIZE / 2}
                      borderWidth={4}
                      style={{ width: NODE_SIZE }}
                      contentStyle={styles.nodeFace}
                    >
                      <Image
                        source={require('../assets/mascots/chest-basic.png')}
                        style={styles.chestImage}
                        resizeMode="contain"
                      />
                    </TactileButton>
                  </View>
                </View>
              );
            }

            const { lvl } = stop;
            const isLocked = lvl.level > unlockedLevel;
            const isCompleted = lvl.level < unlockedLevel;
            const isCurrent = lvl.level === unlockedLevel;
            const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
            // Stars sit under the node you're on and the one you're playing for.
            const showStars = isCurrent || lvl.level === unlockedLevel + 1;

            let bg = colors.lockedBg;
            if (isCompleted) bg = COMPLETED_COLORS[(lvl.level - 1) % COMPLETED_COLORS.length];
            if (isCurrent) bg = colors.primaryContainer;

            return (
              <View
                key={stop.key}
                onLayout={(e) => {
                  if (isCurrent) currentY.current = e.nativeEvent.layout.y;
                }}
              >
                {connector}
                <View style={[styles.nodeRow, { transform: [{ translateX: stop.x }] }]}>
                  <View style={styles.nodeStack}>
                    <TactileButton
                      onPress={() => onSelectLevel(lvl.level)}
                      disabled={isLocked}
                      backgroundColor={bg}
                      shadowColor={colors.border}
                      borderRadius={size / 2}
                      borderWidth={4}
                      style={{ width: size }}
                      contentStyle={[styles.nodeFace, { width: size, height: size }]}
                    >
                      {isLocked ? (
                        <Feather name="lock" size={28} color={colors.textSecondary} />
                      ) : isCompleted ? (
                        <Feather name="check" size={34} color={colors.border} />
                      ) : isCurrent ? (
                        <Feather name="play" size={38} color={colors.onPrimary} />
                      ) : (
                        <Text style={styles.nodeNumber}>{lvl.level}</Text>
                      )}
                    </TactileButton>
                    {showStars && (
                      <View style={[styles.starRow, isLocked && styles.starRowLocked]}>
                        {[0, 1, 2].map((s) => (
                          <Image
                            key={s}
                            source={require('../assets/mascots/star-no.png')}
                            style={isLocked ? styles.starSmall : styles.star}
                            resizeMode="contain"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>More words coming soon</Text>
          <View style={styles.footerLine} />
        </View>
      </ScrollView>

      {hasCurrent && (
        <Pressable style={styles.fab} onPress={scrollToCurrent}>
          <View style={styles.fabShadow} />
          <View style={styles.fabFace}>
            <Feather name="arrow-down" size={22} color={colors.primary} />
          </View>
        </Pressable>
      )}
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
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  bannerWrap: {
    // Leaves room for the 8px solid shadow slab to peek out below the face.
    paddingBottom: 8,
    marginBottom: spacing.lg,
  },
  bannerShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    backgroundColor: colors.primaryShadow,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  banner: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
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
    letterSpacing: 1.6,
    color: '#FFE9E7',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerTitle: {
    ...typography.display,
    color: '#FFFFFF',
  },
  trail: {
    alignItems: 'center',
  },
  connector: {
    alignSelf: 'stretch',
    height: CONNECTOR_HEIGHT,
  },
  connectorDot: {
    position: 'absolute',
    left: '50%',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.lockedBg,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeStack: {
    alignItems: 'center',
  },
  nodeFace: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  starRowLocked: {
    opacity: 0.55,
  },
  star: {
    width: 22,
    height: 22,
  },
  starSmall: {
    width: 18,
    height: 18,
  },
  chestImage: {
    width: 46,
    height: 46,
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
    backgroundColor: colors.outlineVariant,
  },
  footerText: {
    ...typography.heading,
    fontSize: 17,
    color: colors.textMuted,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    paddingBottom: 4,
  },
  fabShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 4,
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
  fabFace: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
});
