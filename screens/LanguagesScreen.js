import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../lib/theme';
import { LANGUAGES } from '../content/languages';
import Mascot from '../components/Mascot';
import CoinBar from '../components/CoinBar';

export default function LanguagesScreen({ onSelectLanguage }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mascot size={48} />
          <View>
            <Text style={typography.title}>Preklinjaj</Text>
            <Text style={typography.caption}>Jezni Kozorog is waiting</Text>
          </View>
        </View>
        <CoinBar />
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
                <Text style={styles.lockIcon}>🔒</Text>
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
  lockIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  lockedText: {
    ...typography.body,
    fontWeight: '700',
  },
  lockedTextEn: {
    ...typography.caption,
  },
});
