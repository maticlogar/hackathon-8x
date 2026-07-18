import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { colors, typography, spacing, radius, rarityColors } from '../lib/theme';
import { getCrateType } from '../content/crates';
import { openCrate } from '../lib/crates';
import { getLanguage } from '../content/languages';
import { scoreRecording } from '../lib/scoring';
import { useGame } from '../lib/store';
import { useTripleTap } from '../lib/tripleTap';

const RARITY_EMOJI = {
  common: '📦',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🌟',
};

const GATE_PASS_THRESHOLD = 55;

// phase: 'building' -> 'burst' -> 'reveal' -> 'gate' -> 'scoring' -> 'pass' | 'fail'
export default function CrateScreen({ crateTypeId, onGoShop, onGoCollection }) {
  const { state, dispatch } = useGame();
  const crateType = getCrateType(crateTypeId);

  const [item] = useState(() => openCrate(crateType, state.demoMode ? 'legendary' : undefined));
  const [phase, setPhase] = useState('building');

  const shake = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(1)).current;
  const rarityScale = useRef(new Animated.Value(0)).current;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const rarityColor = rarityColors[item.rarity];
  const lang = getLanguage(item.lang);

  useEffect(() => {
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 90, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 90, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    shakeLoop.start();

    const timer = setTimeout(() => {
      shakeLoop.stop();
      shake.setValue(0);
      setPhase('burst');
      Animated.parallel([
        Animated.timing(burstScale, { toValue: 1.6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(burstOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.spring(rarityScale, { toValue: 1, friction: 5, delay: 150, useNativeDriver: true }),
      ]).start(() => setPhase('reveal'));
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

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

    let pass;
    if (state.demoMode) {
      pass = true;
    } else {
      const result = await scoreRecording({
        uri: recorder.uri,
        durationMillis,
        targetWord: item.word,
        meaning: item.meaning_en,
        speechCode: lang.speechCode,
        forceFallback: state.forceFallback,
      });
      pass = result.score >= GATE_PASS_THRESHOLD;
    }

    if (pass) {
      dispatch({ type: 'ADD_TO_COLLECTION', item });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('pass');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('fail');
    }
  };

  const rotateInterpolate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  const handleTripleTap = useTripleTap(() => {
    dispatch({ type: 'TOGGLE_FORCE_FALLBACK' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });

  return (
    <View style={styles.screen}>
      {phase === 'building' && (
        <>
          <Animated.Text style={[styles.crateEmoji, { transform: [{ rotate: rotateInterpolate }] }]}>
            {crateType.icon}
          </Animated.Text>
          <Text style={typography.heading}>Odpiranje…</Text>
          <Text style={typography.caption}>Opening…</Text>
        </>
      )}

      {phase === 'burst' && (
        <View style={styles.burstWrap}>
          <Animated.View
            style={[
              styles.burstCircle,
              { backgroundColor: rarityColor, transform: [{ scale: burstScale }], opacity: burstOpacity },
            ]}
          />
          <Animated.Text style={[styles.rarityEmoji, { transform: [{ scale: rarityScale }] }]}>
            {RARITY_EMOJI[item.rarity]}
          </Animated.Text>
        </View>
      )}

      {phase === 'reveal' && (
        <>
          <Text style={styles.rarityEmoji}>{RARITY_EMOJI[item.rarity]}</Text>
          <Text style={[styles.rarityLabel, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
          <Text style={styles.mysteryWord}>???</Text>
          <Pressable style={styles.primaryButton} onPress={() => setPhase('gate')}>
            <Text style={styles.primaryButtonText}>Nadaljuj · Continue</Text>
          </Pressable>
        </>
      )}

      {(phase === 'gate' || phase === 'scoring') && (
        <>
          <Pressable onPress={handleTripleTap}>
            <Text style={typography.label}>IZGOVORI · SAY IT</Text>
          </Pressable>
          <Text style={styles.gateFlag}>{lang?.flag}</Text>
          <Text style={styles.gateWord}>{item.word}</Text>
          <Text style={[typography.caption, { marginBottom: spacing.lg }]}>No guide this time.</Text>

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
          <Text style={typography.caption}>{phase === 'gate' ? 'Hold to record, release to submit' : ''}</Text>
        </>
      )}

      {phase === 'pass' && (
        <>
          <Text style={styles.rarityEmoji}>{RARITY_EMOJI[item.rarity]}</Text>
          <Text style={[styles.rarityLabel, { color: rarityColor }]}>{item.word}</Text>
          <Text style={styles.passText}>✓ V zbirki!</Text>
          <Text style={typography.caption}>Added to collection</Text>
          <View style={styles.resultButtons}>
            <Pressable style={styles.primaryButton} onPress={onGoCollection}>
              <Text style={styles.primaryButtonText}>Zbirka · Collection</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onGoShop}>
              <Text style={styles.secondaryButtonText}>Trgovina · Shop</Text>
            </Pressable>
          </View>
        </>
      )}

      {phase === 'fail' && (
        <>
          <Text style={styles.rarityEmoji}>💨</Text>
          <Text style={styles.failText}>Izgubljeno</Text>
          <Text style={typography.caption}>Lost — better luck next crate</Text>
          <View style={styles.resultButtons}>
            <Pressable style={styles.primaryButton} onPress={onGoShop}>
              <Text style={styles.primaryButtonText}>Trgovina · Shop</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  crateEmoji: {
    fontSize: 96,
  },
  burstWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  rarityEmoji: {
    fontSize: 72,
  },
  rarityLabel: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mysteryWord: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  gateFlag: {
    fontSize: 32,
  },
  gateWord: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
    marginTop: spacing.md,
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
    marginTop: spacing.md,
  },
  passText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
    marginTop: spacing.sm,
  },
  failText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.danger,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.coinGold,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  secondaryButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  resultButtons: {
    alignItems: 'center',
  },
});
