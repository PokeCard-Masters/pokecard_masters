import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function SkeletonBlock({ width, height, borderRadius = 8, delay = 0 }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: '#DDD9C0',
        opacity,
      }}
    />
  );
}

export default function SkeletonLoader() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <SkeletonBlock width={56}  height={56} borderRadius={28} delay={0}   />
        <View style={styles.headerText}>
          <SkeletonBlock width={160} height={14} borderRadius={4}  delay={100} />
          <SkeletonBlock width={70}  height={10} borderRadius={10} delay={200} />
        </View>
      </View>

      <SkeletonBlock width="100%" height={6}  borderRadius={0} delay={0}   />

      {/* Body skeleton */}
      <View style={styles.body}>
        <SkeletonBlock width="100%" height={42} borderRadius={10} delay={100} />
        <View style={{ height: 20 }} />
        <SkeletonBlock width={120} height={10} borderRadius={4}  delay={150} />
        <View style={{ height: 10 }} />
        <SkeletonBlock width="100%" height={46} borderRadius={10} delay={200} />
        <View style={{ height: 10 }} />
        <SkeletonBlock width="100%" height={46} borderRadius={10} delay={250} />
        <View style={{ height: 16 }} />
        <SkeletonBlock width="100%" height={50} borderRadius={12} delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFEF8',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  header: {
    backgroundColor: '#E3350D',
    opacity: 0.3,
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: { flex: 1, gap: 10 },
  body: { padding: 28, gap: 0 },
});