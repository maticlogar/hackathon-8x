import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../lib/theme';
import { useGame } from '../lib/store';

export default function SettingsModal({ visible, onClose }) {
  const { state, dispatch } = useGame();

  const toggleDemoMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: state.demoMode ? 'DISABLE_DEMO_MODE' : 'ENABLE_DEMO_MODE' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={typography.title}>Nastavitve</Text>
          <Text style={[typography.caption, { marginBottom: spacing.lg }]}>Settings</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.heading}>Demo Mode</Text>
              <Text style={typography.caption}>
                Unlocks all levels, 9999 coins, pre-filled collection, rigged legendary crate + auto-pass gate.
              </Text>
            </View>
            <Pressable
              onPress={toggleDemoMode}
              style={[styles.toggle, state.demoMode && styles.toggleOn]}
            >
              <Text style={styles.toggleText}>{state.demoMode ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Zapri · Close</Text>
          </Pressable>
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
  toggle: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleOn: {
    backgroundColor: colors.success,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#141416',
  },
  closeButton: {
    backgroundColor: colors.coinGold,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
});
