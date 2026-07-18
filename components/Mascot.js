import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

// The angry chili pepper — the app's mascot.
export default function Mascot({ size = 56 }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={require('../assets/mascots/app-mascot.png')}
        style={{ width: size * 0.72, height: size * 0.72 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
