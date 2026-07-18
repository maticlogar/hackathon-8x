import { useRef } from 'react';
import { Pressable, View, Animated } from 'react-native';
import { colors, tactile } from '../lib/theme';

// Chunky button with a solid drop-shadow that the face presses down onto on tap.
export default function TactileButton({
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  backgroundColor = colors.card,
  shadowColor,
  borderRadius = 16,
  depth = tactile.depth,
  style,
  contentStyle,
  children,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const resolvedShadow = shadowColor ?? tactile.shadowFor[backgroundColor] ?? colors.border;

  const press = (toValue) => {
    Animated.timing(translateY, { toValue, duration: 60, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={(e) => {
        press(depth);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press(0);
        onPressOut?.(e);
      }}
      style={style}
    >
      <View style={{ position: 'relative', paddingBottom: depth, opacity: disabled ? 0.5 : 1 }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: resolvedShadow,
            borderRadius,
            borderWidth: 2,
            borderColor: colors.border,
          }}
        />
        <Animated.View
          style={[
            {
              backgroundColor,
              borderRadius,
              borderWidth: 2,
              borderColor: colors.border,
              transform: [{ translateY }],
            },
            contentStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}
