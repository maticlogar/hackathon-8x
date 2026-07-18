import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

// Cream "graph paper" backdrop: a 24pt dot tile repeated behind the screen.
export default function DottedBackground() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Image
        source={require('../assets/patterns/dot-grid.png')}
        style={styles.tile}
        resizeMode="repeat"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgPaper,
  },
  tile: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
});
