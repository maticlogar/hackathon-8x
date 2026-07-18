import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { colors, typography, spacing, radius } from '../lib/theme';
import wordpool from '../content/wordpool.json';
import { getLanguage } from '../content/languages';
import { scoreRecording } from '../lib/scoring';
import { useGame } from '../lib/store';

const PASS_THRESHOLD = 55;
const START_LIVES = 3;

const randomWord = (excludeId) => {
  let word;
  do {
    word = wordpool[Math.floor(Math.random() * wordpool.length)];
  } while (word.id === excludeId && wordpool.length > 1);
  return word;
};

// phase: 'word' -> 'scoring' -> 'correct' | 'wrong' -> next word, or 'gameover'
export default function SurvivalScreen({ onBack }) {
  const { dispatch } = useGame();
  const [word, setWord] = useState(() => randomWord());
  const [phase, setPhase] = useState('word');
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const lang = getLanguage(word.lang);

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopRecordingAndJudge = async () => {
    // Read duration before stop() — expo-audio zeroes it out once stopped.
    const durationMillis = recorder.getStatus().durationMillis;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setPhase('scoring');

    const result = await scoreRecording({
      uri: recorder.uri,
      durationMillis,
      targetWord: word.word,
      meaning: word.meaning_en,
      speechCode: lang.speechCode,
    });
    const pass = result.score >= PASS_THRESHOLD;

    if (pass) {
      const nextCombo = combo + 1;
      const multiplier = Math.min(5, 1 + Math.floor(nextCombo / 3));
      const awarded = 5 * multiplier;
      setCombo(nextCombo);
      setBestStreak((b) => Math.max(b, nextCombo));
      setCoinsEarned((c) => c + awarded);
      dispatch({ type: 'ADD_COINS', amount: awarded });
      setLastResult({ awarded, multiplier });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('correct');
    } else {
      setCombo(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLives((l) => {
        const remaining = l - 1;
        setPhase(remaining <= 0 ? 'gameover' : 'wrong');
        return remaining;
      });
    }
  };

  const nextWord = () => {
    setWord((prev) => randomWord(prev.id));
    setPhase('word');
    setLastResult(null);
  };

  if (phase === 'gameover') {
    return (
      <View style={styles.screen}>
        <Text style={styles.gameOverEmoji}>💀</Text>
        <Text style={typography.title}>Konec igre</Text>
        <Text style={typography.caption}>Game over</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryLine}>🪙 Coins earned: {coinsEarned}</Text>
          <Text style={styles.summaryLine}>🔥 Best streak: {bestStreak}</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onBack}>
          <Text style={styles.primaryButtonText}>Nazaj · Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Nazaj</Text>
        </Pressable>
        <Text style={styles.lives}>{'❤️'.repeat(lives)}{'🖤'.repeat(START_LIVES - lives)}</Text>
      </View>

      <View style={styles.comboRow}>
        <Text style={typography.caption}>Combo: {combo}</Text>
        <Text style={[typography.caption, { color: colors.coinGold }]}>🪙 {coinsEarned}</Text>
      </View>

      <View style={styles.wordArea}>
        <Text style={styles.flag}>{lang?.flag}</Text>
        <Text style={styles.word}>{word.word}</Text>
        <Text style={typography.caption}>No guide. Say it.</Text>
      </View>

      {phase === 'correct' && (
        <View style={styles.feedbackArea}>
          <Text style={styles.correctText}>✓ Correct! +{lastResult.awarded} 🪙</Text>
          {lastResult.multiplier > 1 && (
            <Text style={typography.caption}>x{lastResult.multiplier} combo multiplier</Text>
          )}
          <Pressable style={styles.primaryButton} onPress={nextWord}>
            <Text style={styles.primaryButtonText}>Next word</Text>
          </Pressable>
        </View>
      )}

      {phase === 'wrong' && (
        <View style={styles.feedbackArea}>
          <Text style={styles.wrongText}>✗ Missed — lost a life</Text>
          <Pressable style={styles.primaryButton} onPress={nextWord}>
            <Text style={styles.primaryButtonText}>Next word</Text>
          </Pressable>
        </View>
      )}

      {(phase === 'word' || phase === 'scoring') && (
        <View style={styles.micArea}>
          {phase === 'scoring' ? (
            <Text style={styles.judging}>Sodnik posluša…</Text>
          ) : (
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecordingAndJudge}
              style={({ pressed }) => [
                styles.micButton,
                (pressed || recorderState.isRecording) && styles.micButtonActive,
              ]}
            >
              <Text style={styles.micIcon}>🎙️</Text>
            </Pressable>
          )}
          <Text style={typography.caption}>
            {phase === 'word' ? 'Hold to record, release to submit' : ''}
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
    marginBottom: spacing.sm,
  },
  back: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  lives: {
    fontSize: 18,
  },
  comboRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  wordArea: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
  },
  word: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: spacing.xs,
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
  feedbackArea: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  correctText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.success,
  },
  wrongText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.danger,
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
  gameOverEmoji: {
    fontSize: 64,
    marginTop: spacing.xl,
  },
  summary: {
    marginVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLine: {
    ...typography.body,
    fontWeight: '700',
  },
});
