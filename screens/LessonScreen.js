import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  createAudioPlayer,
} from 'expo-audio';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { getLanguage } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { scoreRecording } from '../lib/scoring';
import { speakWord } from '../lib/tts';
import { useGame } from '../lib/store';
import { useTripleTap } from '../lib/tripleTap';
import TactileButton from '../components/TactileButton';

const PASS_THRESHOLD = 60;

const IMG = {
  starYes: require('../assets/mascots/star-yes.png'),
  starNo: require('../assets/mascots/star-no.png'),
  currency: require('../assets/mascots/currency.png'),
  trophy: require('../assets/mascots/trophy.png'),
  fire: require('../assets/mascots/streak-fire-mascot.png'),
  chiliHappy: require('../assets/mascots/lvl-completion-mascot.png'),
  chiliGrump: require('../assets/mascots/app-mascot.png'),
};

const starsForScore = (score) => (score >= 90 ? 3 : score >= 70 ? 2 : score >= 1 ? 1 : 0);

// Looping equalizer bars shown while recording (from the Stitch "recording-pulse" motif).
function RecordingBars() {
  const bars = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, { toValue: 1, duration: 260 + i * 70, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.3, duration: 260 + i * 70, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  return (
    <View style={styles.pulseRow}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={[styles.pulseBar, { transform: [{ scaleY: b }] }]} />
      ))}
    </View>
  );
}

// phase: 'word' -> 'recording' -> 'scoring' -> 'result' -> (retry, or next word / 'levelComplete')
export default function LessonScreen({ langId, level, onExit, onComplete }) {
  const { state, dispatch } = useGame();
  const lang = getLanguage(langId);
  const allLevels = getLevelsForLanguage(langId);
  const words = allLevels.find((l) => l.level === level)?.words ?? [];

  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState('word');
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const slap = useRef(new Animated.Value(0)).current;

  const word = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  const speak = () => {
    speakWord(word.word, langId, lang.speechCode);
  };

  const playAttempt = () => {
    if (!recorder.uri) return;
    try {
      const player = createAudioPlayer(recorder.uri);
      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          player.remove();
        }
      });
      player.play();
    } catch {
      // best-effort playback; ignore if the file isn't available
    }
  };

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('recording');
  };

  const stopRecordingAndScore = async () => {
    // Read duration before stop() — expo-audio zeroes it out once stopped.
    const durationMillis = recorder.getStatus().durationMillis;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setPhase('scoring');
    const result = await scoreRecording({
      uri: recorder.uri,
      durationMillis,
      targetWord: word.word,
      meaning: word.actually_means_en,
      speechCode: lang.speechCode,
      forceFallback: state.forceFallback,
    });
    setLastResult(result);
    setPhase('result');
    const success = result.score >= PASS_THRESHOLD;
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  };

  useEffect(() => {
    if (phase === 'result') {
      slap.setValue(0);
      Animated.spring(slap, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [phase]);

  const handleTripleTap = useTripleTap(() => {
    dispatch({ type: 'TOGGLE_FORCE_FALLBACK' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });

  const handleRetry = () => {
    setPhase('word');
    setRevealed(false);
    setLastResult(null);
  };

  const handleNext = () => {
    if (!lastResult || lastResult.score < PASS_THRESHOLD) return;
    const updatedScores = [...scores, lastResult.score];

    if (!isLastWord) {
      setScores(updatedScores);
      setWordIndex((i) => i + 1);
      setPhase('word');
      setRevealed(false);
      setLastResult(null);
      return;
    }
    const avg = Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length);
    dispatch({ type: 'COMPLETE_LEVEL', lang: langId, level, score: avg });
    setPhase('levelComplete');
  };

  if (!word) return null;

  // ── Tier / level complete (Stitch "LOCAL TIER COMPLETE") ──────────────────
  if (phase === 'levelComplete') {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const stars = starsForScore(avg);
    const coinsAwarded = stars * 10;
    const totalLevels = allLevels.length;
    const unlocked = state.progress[langId]?.unlockedLevel ?? 1;
    const conquered = Math.min(100, Math.round(((unlocked - 1) / totalLevels) * 100));

    return (
      <View style={styles.screen}>
        <View style={styles.completeHeader}>
          <Text style={styles.completeTitle}>
            LEVEL <Text style={styles.completeTitleHi}>COMPLETE</Text>
          </Text>
          <Text style={styles.completeSub}>
            {lang.nameEn} · Level {level} of {totalLevels}
          </Text>
        </View>

        <View style={styles.starsRowBig}>
          {[1, 2, 3].map((n) => (
            <Image
              key={n}
              source={n <= stars ? IMG.starYes : IMG.starNo}
              style={[styles.starImageBig, n === 2 && styles.starImageMid]}
              resizeMode="contain"
            />
          ))}
        </View>

        <View style={styles.statRow}>
          <StatTile img={IMG.currency} value={`+${coinsAwarded}`} label="COINS" />
          <StatTile img={IMG.trophy} value={`${avg}%`} label="ACCURACY" />
          <StatTile img={IMG.fire} value={`${state.streak}`} label="DAY STREAK" />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Chapter progress</Text>
          <Text style={styles.progressTitle}>
            {lang.nameEn} — {conquered}% conquered
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(8, conquered)}%` }]}>
              {conquered >= 14 && <Feather name="zap" size={14} color="#FFFFFF" />}
            </View>
          </View>
        </View>

        <Image source={IMG.chiliHappy} style={styles.completeHero} resizeMode="contain" />

        <View style={styles.completeFooter}>
          <TactileButton
            onPress={onComplete}
            backgroundColor={colors.primaryContainer}
            borderRadius={radius.lg}
            style={{ width: '100%' }}
            contentStyle={styles.claimContent}
          >
            <View style={styles.nextRow}>
              <Text style={styles.claimText}>CLAIM REWARD</Text>
              <Feather name="chevrons-right" size={20} color="#FFFFFF" />
            </View>
          </TactileButton>
          <Pressable onPress={onComplete} hitSlop={8}>
            <Text style={styles.backToPath}>back to path</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Result (Stitch "87/100" chili-slap screen) ───────────────────────────
  if (phase === 'result') {
    const pass = lastResult.score >= PASS_THRESHOLD;
    const rStars = starsForScore(lastResult.score);

    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onExit} hitSlop={12} style={styles.backRow}>
            <Feather name="chevron-left" size={18} color={colors.textSecondary} />
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={typography.caption}>
            {wordIndex + 1} / {words.length}
          </Text>
        </View>

        <View style={styles.resultBody}>
          <View style={styles.resultStars}>
            {[1, 2, 3].map((n) => (
              <Image
                key={n}
                source={n <= rStars ? IMG.starYes : IMG.starNo}
                style={[styles.resultStar, n === 2 && styles.resultStarMid]}
                resizeMode="contain"
              />
            ))}
          </View>

          <Pressable onPress={handleTripleTap} style={styles.scoreRow}>
            <Text style={styles.bigScore}>{lastResult.score}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </Pressable>

          <Animated.Image
            source={pass ? IMG.chiliHappy : IMG.chiliGrump}
            style={[styles.sticker, { transform: [{ scale: slap }, { rotate: '-5deg' }] }]}
            resizeMode="contain"
          />

          <View style={styles.bubble}>
            <View style={styles.bubbleTailOuter} />
            <View style={styles.bubbleTailInner} />
            <Text style={styles.bubbleTitle}>{lastResult.roast_line}</Text>
            <View style={styles.bubbleRow}>
              <View style={styles.sevPill}>
                <Text style={styles.sevPillText}>SPICE</Text>
                <Text style={styles.sevPillChilis}>{'🌶️'.repeat(word.severity)}</Text>
              </View>
              <Pressable onPress={playAttempt} style={styles.hearBtn} hitSlop={6}>
                <Feather name="play" size={14} color={colors.textPrimary} />
                <Text style={styles.hearText}>hear your attempt</Text>
              </Pressable>
            </View>
            {!pass && <Text style={styles.needMore}>Score {PASS_THRESHOLD}+ to continue</Text>}
          </View>
        </View>

        <View style={styles.resultActions}>
          {pass ? (
            <>
              <TactileButton
                onPress={handleNext}
                backgroundColor={colors.primaryContainer}
                borderRadius={radius.lg}
                style={{ width: '100%' }}
                contentStyle={styles.nextContent}
              >
                <View style={styles.nextRow}>
                  <Text style={styles.nextText}>{isLastWord ? 'FINISH LEVEL' : 'NEXT'}</Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </View>
              </TactileButton>
              <Pressable onPress={handleRetry} hitSlop={8} style={styles.againBtn}>
                <Text style={styles.againText}>Again. Now.</Text>
              </Pressable>
            </>
          ) : (
            <TactileButton
              onPress={handleRetry}
              backgroundColor={colors.primaryContainer}
              borderRadius={radius.lg}
              style={{ width: '100%' }}
              contentStyle={styles.nextContent}
            >
              <View style={styles.nextRow}>
                <Feather name="rotate-ccw" size={18} color="#FFFFFF" />
                <Text style={styles.nextText}>AGAIN. NOW.</Text>
              </View>
            </TactileButton>
          )}
        </View>
      </View>
    );
  }

  // ── Word + record (Stitch "Scenario Challenge" recording interface) ──────
  const isRecording = recorderState.isRecording;
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.backRow}>
          <Feather name="chevron-left" size={18} color={colors.textSecondary} />
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={typography.caption}>
          {wordIndex + 1} / {words.length}
        </Text>
      </View>

      <View style={styles.wordCard}>
        <Text style={styles.wordCardLabel}>Say it like a local</Text>
        <Text style={styles.word}>{word.word}</Text>
        <Text style={styles.phonetic}>{word.phonetic}</Text>
      </View>

      <View style={styles.sevRow}>
        <Text style={styles.sevLabel}>SPICE</Text>
        <Text style={styles.sevChilis}>{'🌶️'.repeat(word.severity)}</Text>
      </View>

      <TactileButton
        onPress={speak}
        backgroundColor={colors.card}
        borderRadius={radius.pill}
        contentStyle={styles.playButtonContent}
        style={{ marginTop: spacing.md }}
      >
        <View style={styles.playButtonRow}>
          <Feather name="volume-2" size={16} color={colors.textPrimary} />
          <Text style={styles.playButtonText}>Play</Text>
        </View>
      </TactileButton>

      <Pressable style={styles.revealArea} onPress={() => setRevealed((r) => !r)}>
        {revealed ? (
          <View>
            <Text style={typography.label}>WHAT YOU'RE SAYING</Text>
            <Text style={styles.revealText}>{word.literal_en}</Text>
            <Text style={[typography.label, { marginTop: spacing.sm }]}>WHAT IT MEANS</Text>
            <Text style={styles.revealText}>{word.actually_means_en}</Text>
            <Text style={[typography.caption, { marginTop: spacing.sm }]}>{word.usage_note_en}</Text>
          </View>
        ) : (
          <Text style={typography.caption}>Tap to reveal meaning</Text>
        )}
      </Pressable>

      <View style={styles.micArea}>
        {phase === 'scoring' ? (
          <Text style={styles.judging}>Judging…</Text>
        ) : (
          <>
            {isRecording ? <RecordingBars /> : <View style={styles.pulseRow} />}
            <TactileButton
              onPressIn={startRecording}
              onPressOut={stopRecordingAndScore}
              backgroundColor={isRecording ? colors.danger : colors.primaryContainer}
              borderRadius={48}
              contentStyle={styles.micButtonContent}
            >
              <Feather name="mic" size={40} color={colors.onPrimary} />
            </TactileButton>
            <Text style={typography.caption}>
              {isRecording ? 'Release to submit' : 'Hold to record, release to submit'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function StatTile({ img, value, label }) {
  return (
    <View style={styles.statTile}>
      <Image source={img} style={styles.statImg} resizeMode="contain" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const hardShadow = (color, height = 4) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: height,
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
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

  // Word + record
  wordCard: {
    width: '100%',
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...hardShadow(colors.primaryShadow, 6),
  },
  wordCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FFE9E7',
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.9,
  },
  word: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  phonetic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFE9E7',
    marginTop: spacing.xs,
  },
  sevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  sevLabel: {
    ...typography.label,
  },
  sevChilis: {
    fontSize: 16,
  },
  playButtonContent: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  playButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  revealArea: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    minHeight: 90,
  },
  revealText: {
    ...typography.body,
  },
  micArea: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  micButtonContent: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
  },
  pulseBar: {
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
  },
  judging: {
    ...typography.heading,
    color: colors.textSecondary,
    marginTop: 'auto',
  },

  // Result
  resultBody: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  resultStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  resultStar: {
    width: 44,
    height: 44,
  },
  resultStarMid: {
    width: 56,
    height: 56,
    marginTop: -8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  bigScore: {
    fontSize: 80,
    fontWeight: '900',
    color: colors.primaryContainer,
    lineHeight: 84,
  },
  scoreOutOf: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textMuted,
    marginLeft: 4,
  },
  sticker: {
    width: 150,
    height: 150,
    marginVertical: spacing.xs,
  },
  bubble: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...hardShadow(colors.border, 4),
  },
  bubbleTailOuter: {
    position: 'absolute',
    top: -12,
    left: 32,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.border,
  },
  bubbleTailInner: {
    position: 'absolute',
    top: -9,
    left: 34,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.card,
    zIndex: 1,
  },
  bubbleTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sevPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sevPillChilis: {
    fontSize: 12,
  },
  hearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  hearText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  needMore: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  resultActions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextContent: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  againBtn: {
    paddingVertical: spacing.xs,
  },
  againText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Level complete
  completeHeader: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  completeTitleHi: {
    color: colors.primaryContainer,
  },
  completeSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  starsRowBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  starImageBig: {
    width: 40,
    height: 40,
  },
  starImageMid: {
    width: 52,
    height: 52,
    marginTop: -8,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...hardShadow(colors.border, 4),
  },
  statImg: {
    width: 44,
    height: 44,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    ...hardShadow(colors.border, 4),
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  progressTitle: {
    ...typography.body,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    width: '100%',
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.pill,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  completeHero: {
    width: 150,
    height: 150,
    marginTop: spacing.md,
  },
  completeFooter: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  claimContent: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  claimText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  backToPath: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
