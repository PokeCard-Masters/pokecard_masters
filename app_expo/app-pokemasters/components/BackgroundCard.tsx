import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = 58;
const CARD_HEIGHT = 82;
const CARD_GAP = 14;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const TYPES = [
  { bg: '#E3350D', stripe: '#FF6B4A', ball: '#C02A09' }, // Feu
  { bg: '#4A90D9', stripe: '#7BB8F0', ball: '#2D6FAF' }, // Eau
  { bg: '#FFCB05', stripe: '#FFE57F', ball: '#D4A800' }, // Électrik
  { bg: '#5BAD57', stripe: '#8FD48C', ball: '#3A7A37' }, // Plante
  { bg: '#C879CE', stripe: '#E4A8E8', ball: '#8B4D91' }, // Psy
  { bg: '#3B4CCA', stripe: '#7986CB', ball: '#1A2A8B' }, // Eau 2
  { bg: '#E07240', stripe: '#F0A880', ball: '#A04A20' }, // Combat
  { bg: '#9BAAB5', stripe: '#C5D0D8', ball: '#6A7F8B' }, // Normal
];

const CARDS_PER_ROW = Math.ceil(SCREEN_WIDTH / CARD_STEP) + 4;

function PokemonCard({ type }: { type: typeof TYPES[0] }) {
  return (
    <View style={[styles.card, { backgroundColor: type.bg, borderColor: type.stripe }]}>
      <View style={[styles.cardStripe, { backgroundColor: type.stripe }]} />
      <View style={styles.cardBody}>
        <View style={[styles.cardBall, { borderColor: type.ball }]}>
          <View style={[styles.cardBallInner, { backgroundColor: type.ball }]} />
        </View>
        <View style={styles.cardLines}>
          <View style={[styles.cardLine, { backgroundColor: type.stripe, width: '80%' }]} />
          <View style={[styles.cardLine, { backgroundColor: type.stripe, width: '55%' }]} />
          <View style={[styles.cardLine, { backgroundColor: type.stripe, width: '65%' }]} />
        </View>
      </View>
      <View style={[styles.cardFooter, { backgroundColor: type.ball }]} />
    </View>
  );
}

function CardRow({ direction, speed, offset }: {
  direction: 'left' | 'right';
  speed: number;
  offset: number;
}) {
  const translateX = useRef(new Animated.Value(direction === 'left' ? 0 : -CARD_STEP * 4)).current;
  const totalWidth = CARD_STEP * CARDS_PER_ROW;

  useEffect(() => {
    const toValue = direction === 'left' ? -CARD_STEP * 4 : 0;
    const fromValue = direction === 'left' ? 0 : -CARD_STEP * 4;
    translateX.setValue(fromValue);

    Animated.loop(
      Animated.timing(translateX, {
        toValue,
        duration: speed,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const cards = Array.from({ length: CARDS_PER_ROW }, (_, i) => ({
    type: TYPES[(i + offset) % TYPES.length],
    key: i,
  }));

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {/* Double les cartes pour un loop sans coupure */}
      {[...cards, ...cards].map((card, i) => (
        <PokemonCard key={i} type={card.type} />
      ))}
    </Animated.View>
  );
}

export default function BackgroundCards() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.overlay} />
      <View style={styles.rowsContainer}>
        <CardRow direction="left"  speed={18000} offset={0} />
        <CardRow direction="right" speed={22000} offset={3} />
        <CardRow direction="left"  speed={15000} offset={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 242, 247, 0.82)',
    zIndex: 1,
  },
  rowsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    opacity: 0.35,
  },
  cardStripe: {
    height: 5,
    width: '100%',
  },
  cardBody: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    gap: 6,
  },
  cardBall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBallInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.6,
  },
  cardLines: {
    width: '100%',
    gap: 4,
    alignItems: 'flex-start',
  },
  cardLine: {
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  cardFooter: {
    height: 10,
    opacity: 0.4,
  },
});