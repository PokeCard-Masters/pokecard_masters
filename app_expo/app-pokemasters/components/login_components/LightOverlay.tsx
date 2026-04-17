import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export type LightningRef = { flash: () => void };

const LightningOverlay = forwardRef<LightningRef>((_, ref) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleY  = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    flash() {
      opacity.setValue(0);
      scaleY.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.85, duration: 60,  useNativeDriver: true }),
          Animated.timing(scaleY,  { toValue: 1,    duration: 60,  useNativeDriver: true }),
        ]),
        Animated.timing(opacity,   { toValue: 0.3,  duration: 80,  useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0.7,  duration: 50,  useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0,    duration: 250, useNativeDriver: true }),
      ]).start();
    },
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity, transform: [{ scaleY }] }]}
    />
  );
});

export default LightningOverlay;

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#FFCB05',
    zIndex: 99,
  },
});