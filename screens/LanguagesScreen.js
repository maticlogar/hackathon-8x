import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../lib/theme';
import { LANGUAGES } from '../content/languages';
import Mascot from '../components/Mascot';
import CoinBar from '../components/CoinBar';
import SettingsModal from '../components/SettingsModal';

export default function LanguagesScreen({ onSelectLanguage, onOpenShop, onOpenCollection, onOpenSurvival }) {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mascot size={48} />
          <View>
            <Text style={typography.title}>Preklinjaj</Text>
            <Text style={typography.caption}>Jezni Kozorog is waiting</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <CoinBar />
          <Pressable style={styles.gearButton} onPress={() => setSettingsVisible(true)} hitSlop={8}>
            <Feather name="settings" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.navButton} onPress={onOpenShop}>
          <Feather name="shopping-cart" size={22} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Trgovina</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onOpenCollection}>
          <Feather name="package" size={22} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Zbirka</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onOpenSurvival}>
          <Feather name="alert-triangle" size={22} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Preživetje</Text>
        </Pressable>
      </View>

      <Text style={[typography.label, styles.sectionLabel]}>IZBERI JEZIK / CHOOSE LANGUAGE</Text>

      <View style={styles.grid}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.id}
            disabled={lang.locked}
            onPress={() => onSelectLanguage(lang.id)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: lang.locked ? colors.border : lang.accent },
              pressed && !lang.locked && styles.cardPressed,
            ]}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={styles.langName}>{lang.name}</Text>
            <Text style={styles.langNameEn}>{lang.nameEn}</Text>
            {lang.locked && (
              <View style={styles.lockedOverlay}>
                <Feather name="lock" size={26} color={colors.textPrimary} style={{ marginBottom: 4 }} />
                <Text style={styles.lockedText}>Kmalu</Text>
                <Text style={styles.lockedTextEn}>Coming soon</Text>
              </View>
            )}
          </Pressable>
        ))}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gearButton: {
    padding: 4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  navLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
  },
  flag: {
    fontSize: 44,
    marginBottom: spacing.xs,
  },
  langName: {
    ...typography.heading,
    fontSize: 17,
  },
  langNameEn: {
    ...typography.caption,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.lockedOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    ...typography.body,
    fontWeight: '700',
  },
  lockedTextEn: {
    ...typography.caption,
  },
});
