import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Speech from 'expo-speech';
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
import { getMockScore } from '../lib/scoring';
import { useGame } from '../lib/store';

// phase: 'word' -> 'recording' -> 'scoring' -> 'result' -> (next word or 'levelComplete')
export default function LessonScreen({ langId, level, onExit, onComplete }) {
  const { dispatch } = useGame();
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
    Speech.speak(word.word, { language: lang.speechCode });
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
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setPhase('scoring');
    setTimeout(() => {
      const result = getMockScore();
      setLastResult(result);
      setScores((prev) => [...prev, result.score]);
      setPhase('result');
      const success = result.score >= 70;
      Haptics.notificationAsync(
        success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
    }, 700);
  };

  useEffect(() => {
    if (phase === 'result') {
      ringScale.setValue(0);
      Animated.spring(ringScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [phase]);

  const handleContinue = () => {
    if (!isLastWord) {
      setWordIndex((i) => i + 1);
      setPhase('word');
      setRevealed(false);
      setLastResult(null);
      return;
    }
    const finalScores = scores;
    const avg = Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length);
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
          <Animated.View
            style={[
              styles.scoreRing,
              {
                borderColor: lastResult.score >= 70 ? colors.success : colors.danger,
                transform: [{ scale: ringScale }],
              },
            ]}
          >
            <Text style={styles.scoreNumber}>{lastResult.score}</Text>
          </Animated.View>
          <Text style={styles.roast}>{lastResult.roast_line}</Text>
          <Pressable style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>{isLastWord ? 'Finish level' : 'Next word'}</Text>
          </Pressable>
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  starsRow: {
    fontSize: 32,
    marginVertical: spacing.sm,
  },
});
