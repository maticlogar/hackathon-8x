import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../lib/theme';

const TABS = [
  { key: 'journey', icon: 'map', label: 'Journey', screens: ['languages', 'levels'], target: 'languages' },
  { key: 'shop', icon: 'shopping-cart', label: 'Shop', screens: ['shop'], target: 'shop' },
  { key: 'collection', icon: 'package', label: 'Collection', screens: ['collection'], target: 'collection' },
  { key: 'survival', icon: 'alert-triangle', label: 'Survival', screens: ['survival'], target: 'survival' },
];

export default function BottomTabBar({ activeScreen, onNavigate }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.screens.includes(activeScreen);
        return (
          <Pressable
            key={tab.key}
            onPress={() => onNavigate(tab.target)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Feather
              name={tab.icon}
              size={22}
              color={active ? colors.onSecondaryContainer : colors.textSecondary}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: -6,
    shadowColor: colors.secondaryShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.onSecondaryContainer,
  },
});
