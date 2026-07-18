import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
import TactileButton from '../components/TactileButton';

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
          <Animated.Image
            source={crateType.image}
            style={[styles.crateImage, { transform: [{ rotate: rotateInterpolate }] }]}
            resizeMode="contain"
          />
          <Text style={typography.heading}>Opening…</Text>
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
          <Animated.Image
            source={crateType.imageOpen}
            style={[styles.burstChestImage, { transform: [{ scale: rarityScale }] }]}
            resizeMode="contain"
          />
        </View>
      )}

      {phase === 'reveal' && (
        <>
          <Feather name="award" size={72} color={rarityColor} />
          <Text style={[styles.rarityLabel, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
          <Text style={styles.mysteryWord}>???</Text>
          <TactileButton
            onPress={() => setPhase('gate')}
            backgroundColor={colors.tertiaryContainer}
            borderRadius={radius.pill}
            contentStyle={styles.primaryButtonContent}
            style={{ marginTop: spacing.md }}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TactileButton>
        </>
      )}

      {(phase === 'gate' || phase === 'scoring') && (
        <>
          <Pressable onPress={handleTripleTap}>
            <Text style={typography.label}>SAY IT</Text>
          </Pressable>
          <Text style={styles.gateFlag}>{lang?.flag}</Text>
          <Text style={styles.gateWord}>{item.word}</Text>
          <Text style={[typography.caption, { marginBottom: spacing.lg }]}>No guide this time.</Text>

          {phase === 'scoring' ? (
            <Text style={styles.judging}>Judging…</Text>
          ) : (
            <TactileButton
              onPressIn={startRecording}
              onPressOut={stopRecordingAndJudge}
              backgroundColor={recorderState.isRecording ? colors.danger : colors.card}
              borderRadius={44}
              contentStyle={styles.micButtonContent}
              style={{ marginTop: spacing.md }}
            >
              <Feather name="mic" size={36} color={colors.textPrimary} />
            </TactileButton>
          )}
          <Text style={typography.caption}>{phase === 'gate' ? 'Hold to record, release to submit' : ''}</Text>
        </>
      )}

      {phase === 'pass' && (
        <>
          <Feather name="award" size={72} color={rarityColor} />
          <Text style={[styles.rarityLabel, { color: rarityColor }]}>{item.word}</Text>
          <View style={styles.passRow}>
            <Feather name="check-circle" size={22} color={colors.success} />
            <Text style={styles.passText}>Added to collection!</Text>
          </View>
          <View style={styles.resultButtons}>
            <TactileButton
              onPress={onGoCollection}
              backgroundColor={colors.tertiaryContainer}
              borderRadius={radius.pill}
              contentStyle={styles.primaryButtonContent}
              style={{ marginTop: spacing.md }}
            >
              <Text style={styles.primaryButtonText}>Collection</Text>
            </TactileButton>
            <TactileButton
              onPress={onGoShop}
              backgroundColor={colors.card}
              borderRadius={radius.pill}
              contentStyle={styles.secondaryButtonContent}
              style={{ marginTop: spacing.sm }}
            >
              <Text style={styles.secondaryButtonText}>Shop</Text>
            </TactileButton>
          </View>
        </>
      )}

      {phase === 'fail' && (
        <>
          <Feather name="x-circle" size={72} color={colors.danger} />
          <Text style={styles.failText}>Lost!</Text>
          <Text style={typography.caption}>Better luck next crate</Text>
          <View style={styles.resultButtons}>
            <TactileButton
              onPress={onGoShop}
              backgroundColor={colors.tertiaryContainer}
              borderRadius={radius.pill}
              contentStyle={styles.primaryButtonContent}
              style={{ marginTop: spacing.md }}
            >
              <Text style={styles.primaryButtonText}>Shop</Text>
            </TactileButton>
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
  crateImage: {
    width: 160,
    height: 160,
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
  burstChestImage: {
    width: 150,
    height: 150,
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
  micButtonContent: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judging: {
    ...typography.heading,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  passText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
  },
  failText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.danger,
    marginTop: spacing.sm,
  },
  primaryButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  secondaryButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  resultButtons: {
    alignItems: 'center',
  },
});
