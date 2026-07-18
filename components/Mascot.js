import { View, Text, StyleSheet } from 'react-native';

// Jezni Kozorog — the Angry Ibex mascot. Emoji-based, no image assets.
export default function Mascot({ size = 56 }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.6 }}>🐐</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>💢</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#2a1414',
    borderWidth: 2,
    borderColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  badgeText: {
    fontSize: 16,
  },
});
