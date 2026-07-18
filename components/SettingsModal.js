import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../lib/theme';
import { useGame } from '../lib/store';
import TactileButton from './TactileButton';

export default function SettingsModal({ visible, onClose }) {
  const { state, dispatch } = useGame();

  const toggleDemoMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: state.demoMode ? 'DISABLE_DEMO_MODE' : 'ENABLE_DEMO_MODE' });
  };

  const addCoins = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'ADD_COINS', amount: 9999 });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={typography.title}>Settings</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.heading}>Demo Mode</Text>
              <Text style={typography.caption}>
                Unlocks all levels, 9999 coins, full collection, rigged legendary crate + auto-pass gate. Reverts everything when turned off.
              </Text>
            </View>
            <TactileButton
              onPress={toggleDemoMode}
              backgroundColor={state.demoMode ? colors.success : colors.lockedBg}
              borderRadius={radius.pill}
              contentStyle={styles.toggleContent}
            >
              <Text style={styles.toggleText}>{state.demoMode ? 'ON' : 'OFF'}</Text>
            </TactileButton>
            <TactileButton
              onPress={addCoins}
              backgroundColor={colors.coinGold}
              borderRadius={radius.pill}
              contentStyle={styles.toggleContent}
            >
              <Text style={styles.toggleText}>+9999</Text>
            </TactileButton>
          </View>

          <TactileButton
            onPress={onClose}
            backgroundColor={colors.coinGold}
            borderRadius={radius.pill}
            contentStyle={styles.closeButtonContent}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TactileButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#141416',
  },
  closeButtonContent: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
});
