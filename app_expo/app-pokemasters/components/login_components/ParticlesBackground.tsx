import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

const SEASON_PARTICLES = {
  spring: ['🌸', '🌿', '🌼'],
  summer: ['⭐', '✨', '💫'],
  autumn: ['🍂', '🍁', '🍃'],
  winter: ['❄️', '⭐', '✨'],
};

function Particle({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;

  const startX  = Math.random() * W;
  const drift   = (Math.random() - 0.5) * 80;
  const speed   = 6000 + Math.random() * 8000;
  const delay   = Math.random() * 10000;
  const size    = 12 + Math.random() * 10;

  useEffect(() => {
    const loop = () => {
      translateY.setValue(-40);
      translateX.setValue(0);
      opacity.setValue(0);
      rotate.setValue(0);

      Animated.sequence([
        Animated.delay(delay + index * 400),
        Animated.parallel([
          Animated.timing(translateY, { toValue: H + 40, duration: speed, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: drift,  duration: speed, useNativeDriver: true }),
          Animated.timing(rotate,     { toValue: 1,      duration: speed, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 600,          useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: speed - 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: 600,          useNativeDriver: true }),
          ]),
        ]),
      ]).start(loop);
    };
    loop();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        fontSize: size,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function ParticlesBackground() {
  const season    = getSeason();
  const emojis    = SEASON_PARTICLES[season];
  const particles = Array.from({ length: 18 }, (_, i) => ({
    emoji: emojis[i % emojis.length],
    key:   i,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => <Particle key={p.key} emoji={p.emoji} index={p.key} />)}
    </View>
  );
}