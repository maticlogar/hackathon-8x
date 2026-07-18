import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { colors, typography, spacing, radius, severityColor } from '../lib/theme';
import { getLanguage } from '../content/languages';
import { getLevelsForLanguage } from '../lib/lessons';
import { scoreRecording } from '../lib/scoring';
import { speakWord } from '../lib/tts';
import { useGame } from '../lib/store';
import { useTripleTap } from '../lib/tripleTap';

const PASS_THRESHOLD = 60;

// phase: 'word' -> 'recording' -> 'scoring' -> 'result' -> (retry, or next word / 'levelComplete')
export default function LessonScreen({ langId, level, onExit, onComplete }) {
  const { state, dispatch } = useGame();
  const lang = getLanguage(langId);
  const words = getLevelsForLanguage(langId).find((l) => l.level === level)?.words ?? [];

  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState('word');
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const ringScale = useRef(new Animated.Value(0)).current;

  const word = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  const speak = () => {
    speakWord(word.word, langId, lang.speechCode);
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
      ringScale.setValue(0);
      Animated.spring(ringScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
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

  if (phase === 'levelComplete') {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const stars = avg >= 90 ? 3 : avg >= 70 ? 2 : 1;
    const coinsAwarded = stars * 10;
    return (
      <View style={styles.screen}>
        <Text style={typography.title}>Level complete</Text>
        <Text style={styles.starsRow}>{'⭐'.repeat(stars)}</Text>
        <Text style={typography.body}>Average score: {avg}</Text>
        <Text style={[typography.body, { color: colors.coinGold }]}>+{coinsAwarded} 🪙</Text>
        <Pressable style={styles.primaryButton} onPress={onComplete}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.back}>‹ Nazaj</Text>
        </Pressable>
        <Text style={typography.caption}>
          {wordIndex + 1} / {words.length}
        </Text>
      </View>

      <View style={styles.wordArea}>
        <Text style={styles.word}>{word.word}</Text>
        <Text style={styles.phonetic}>{word.phonetic}</Text>

        <View style={styles.chiliRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Text
              key={n}
              style={[styles.chili, { opacity: n <= word.severity ? 1 : 0.2 }]}
            >
              🌶️
            </Text>
          ))}
        </View>

        <Pressable style={styles.playButton} onPress={speak}>
          <Text style={styles.playButtonText}>▶ Play</Text>
        </Pressable>

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
      </View>

      {phase === 'result' ? (
        <View style={styles.resultArea}>
          <Pressable onPress={handleTripleTap}>
            <Animated.View
              style={[
                styles.scoreRing,
                {
                  borderColor: lastResult.score >= PASS_THRESHOLD ? colors.success : colors.danger,
                  transform: [{ scale: ringScale }],
                },
              ]}
            >
              <Text style={styles.scoreNumber}>{lastResult.score}</Text>
            </Animated.View>
          </Pressable>
          <Text style={styles.roast}>{lastResult.roast_line}</Text>
          {lastResult.score < PASS_THRESHOLD && (
            <Text style={typography.caption}>Score {PASS_THRESHOLD}+ to continue</Text>
          )}
          <View style={styles.resultButtons}>
            <Pressable style={styles.secondaryButton} onPress={handleRetry}>
              <Text style={styles.secondaryButtonText}>Poskusi znova · Retry</Text>
            </Pressable>
            <Pressable
              disabled={lastResult.score < PASS_THRESHOLD}
              style={[
                styles.primaryButton,
                lastResult.score < PASS_THRESHOLD && styles.primaryButtonDisabled,
              ]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>
                {isLastWord ? 'Dokončaj · Finish level' : 'Naprej · Next word'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.micArea}>
          {phase === 'scoring' ? (
            <Text style={styles.judging}>Sodnik posluša…</Text>
          ) : (
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecordingAndScore}
              style={({ pressed }) => [
                styles.micButton,
                (pressed || recorderState.isRecording) && styles.micButtonActive,
              ]}
            >
              <Text style={styles.micIcon}>🎙️</Text>
            </Pressable>
          )}
          <Text style={typography.caption}>
            {phase === 'scoring' ? '' : 'Hold to record, release to submit'}
          </Text>
        </View>
      )}
    </View>
  );
}

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
  back: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  wordArea: {
    alignItems: 'center',
    width: '100%',
  },
  word: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phonetic: {
    ...typography.caption,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  chiliRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.md,
  },
  chili: {
    fontSize: 20,
  },
  playButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  playButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  revealArea: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
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
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgElevated,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  micIcon: {
    fontSize: 36,
  },
  judging: {
    ...typography.heading,
    color: colors.textSecondary,
  },
  resultArea: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  roast: {
    ...typography.body,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.coinGold,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  starsRow: {
    fontSize: 32,
    marginVertical: spacing.sm,
  },
});
