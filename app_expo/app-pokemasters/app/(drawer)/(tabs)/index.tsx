import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SW } = Dimensions.get('window');

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  void: '#06060F',
  deep: '#0C0C1E',
  surface: '#12122A',
  border: '#252550',
  gold: '#F0C040',
  goldLight: '#FFE080',
  goldDark: '#9A7A10',
  cyan: '#00E5FF',
  cyanDim: '#004455',
  text: '#E8E8FF',
  muted: '#5A5A90',
  dimmer: '#2A2A50',
};

// ─── Types ───────────────────────────────────────────────────────────────────
type Rarity = 'Common' | 'Rare' | 'Ultra Rare' | 'Secret';
type Phase = 'idle' | 'shaking' | 'burst' | 'revealed';

type Card = {
  id: number;
  name: string;
  image: string;
  rarity: Rarity;
};

// ─── Cards ───────────────────────────────────────────────────────────────────
const CARDS: Card[] = [
  {
    id: 1,
    name: 'Bulbizarre',
    image:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    rarity: 'Common',
  },
  {
    id: 4,
    name: 'Salamèche',
    image:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
    rarity: 'Common',
  },
  {
    id: 7,
    name: 'Carapuce',
    image:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
    rarity: 'Rare',
  },
  {
    id: 25,
    name: 'Pikachu',
    image:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    rarity: 'Ultra Rare',
  },
  {
    id: 150,
    name: 'Mewtwo',
    image:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    rarity: 'Secret',
  },
];

// ─── Rarity config ───────────────────────────────────────────────────────────
function rarityConfig(r: Rarity) {
  switch (r) {
    case 'Common':
      return {
        label: 'COMMUN',
        cardBg: '#101028',
        borderColor: '#303060',
        textColor: '#7070B0',
        glowColor: 'transparent',
        shimmer: false,
      };
    case 'Rare':
      return {
        label: 'RARE',
        cardBg: '#08142A',
        borderColor: '#2060C0',
        textColor: '#60A0F0',
        glowColor: '#2060C060',
        shimmer: false,
      };
    case 'Ultra Rare':
      return {
        label: 'ULTRA RARE',
        cardBg: '#180E00',
        borderColor: '#D09000',
        textColor: '#F0C040',
        glowColor: '#D0900060',
        shimmer: true,
      };
    case 'Secret':
      return {
        label: 'SECRET',
        cardBg: '#150820',
        borderColor: '#9050E0',
        textColor: '#C090FF',
        glowColor: '#9050E070',
        shimmer: true,
      };
  }
}

// ─── Pre-computed particle configs ───────────────────────────────────────────
const PARTICLE_COUNT = 20;
const PARTICLE_COLORS = [
  P.gold,
  P.goldLight,
  P.cyan,
  '#FF5080',
  '#A060FF',
  '#FFFFFF',
  '#FF9030',
];
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3;
  const dist = 70 + (i % 3) * 40;
  return {
    destX: Math.cos(angle) * dist,
    destY: Math.sin(angle) * dist,
    size: 3 + (i % 4),
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: (i % 5) * 20,
  };
});

// ─── Particle ─────────────────────────────────────────────────────────────────
function Particle({
  config,
  trigger,
}: {
  config: (typeof PARTICLES)[0];
  trigger: boolean;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    tx.setValue(0);
    ty.setValue(0);
    opacity.setValue(0);
    scale.setValue(0);

    const t = setTimeout(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tx, {
            toValue: config.destX,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ty, {
            toValue: config.destY,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, config.delay);

    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          opacity,
          transform: [{ translateX: tx }, { translateY: ty }, { scale }],
        },
      ]}
    />
  );
}

// ─── Shimmer overlay (for Ultra Rare / Secret) ────────────────────────────────
function Shimmer({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.25, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity, borderRadius: 20 }]}
    />
  );
}

// ─── Flippable Card ───────────────────────────────────────────────────────────
function FlippableCard({ card, delay }: { card: Card; delay: number }) {
  const flip = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.6)).current;
  const entryY = useRef(new Animated.Value(40)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const cfg = useMemo(() => rarityConfig(card.rarity), [card.rarity]);
  const isSpecial = card.rarity === 'Ultra Rare' || card.rarity === 'Secret';

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(entryScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(entryY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(flip, {
            toValue: 180,
            duration: 550,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            if (isSpecial) {
              Animated.loop(
                Animated.sequence([
                  Animated.timing(glow, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(glow, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                ])
              ).start();
            }
          });
        }, 80);
      });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  // Back face: 0→90 deg
  const backRotateY = flip.interpolate({
    inputRange: [0, 90, 180],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backOpacity = flip.interpolate({
    inputRange: [0, 89, 90],
    outputRange: [1, 1, 0],
  });

  // Front face: -90→0 deg (starts hidden, slides into view)
  const frontRotateY = flip.interpolate({
    inputRange: [0, 90, 180],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });
  const frontOpacity = flip.interpolate({
    inputRange: [0, 89, 90],
    outputRange: [0, 0, 1],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [
            { scale: entryScale },
            { translateY: entryY },
            ...(isSpecial ? [{ scale: glowScale }] : []),
          ],
        },
      ]}
    >
      {/* ── Card back ── */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            opacity: backOpacity,
            transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
          },
        ]}
      >
        <View style={styles.cardBackInner}>
          <View style={styles.cardBackBadge}>
            <Text style={styles.cardBackBadgeText}>TCG</Text>
          </View>
          <View style={styles.cardBackCircle}>
            <Text style={styles.cardBackEmoji}>⚡</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Card front ── */}
      <Animated.View
        style={[
          styles.cardFace,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: cfg.cardBg,
            borderColor: cfg.borderColor,
            opacity: frontOpacity,
            transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
            shadowColor: cfg.borderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isSpecial ? 0.9 : 0,
            shadowRadius: 16,
            elevation: isSpecial ? 16 : 0,
          },
        ]}
      >
        {cfg.shimmer && <Shimmer color={cfg.borderColor} />}

        {/* Rarity badge */}
        <View
          style={[
            styles.rarityBadge,
            { backgroundColor: cfg.glowColor, borderColor: cfg.borderColor },
          ]}
        >
          <Text style={[styles.rarityText, { color: cfg.textColor }]}>
            {cfg.label}
          </Text>
        </View>

        {/* Pokemon image */}
        <View style={styles.imageArea}>
          <Image
            source={{ uri: card.image }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>

        {/* Name & number */}
        <View
          style={[
            styles.cardFooter,
            { borderTopColor: cfg.borderColor + '50' },
          ]}
        >
          <Text style={styles.cardName} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={[styles.cardNumber, { color: cfg.textColor }]}>
            #{String(card.id).padStart(3, '0')}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Floating pack animation ──────────────────────────────────────────────────
function useFloatAnim() {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    return () => floatY.stopAnimation();
  }, []);
  return floatY;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BoosterOpening() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [particleTrigger, setParticleTrigger] = useState(false);

  // Pack anims
  const packScale = useRef(new Animated.Value(1)).current;
  const packRotZ = useRef(new Animated.Value(0)).current;
  const packOpacity = useRef(new Animated.Value(1)).current;
  const packGlow = useRef(new Animated.Value(0)).current;
  const whiteFlash = useRef(new Animated.Value(0)).current;
  // Reveal anims
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealY = useRef(new Animated.Value(30)).current;
  // Idle float
  const floatY = useFloatAnim();

  const packRotZInterp = packRotZ.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });
  const glowOpacity = packGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  const openBooster = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('shaking');

    // 1. Shake + scale up glow
    Animated.parallel([
      Animated.sequence([
        Animated.timing(packRotZ, {
          toValue: 1,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(packRotZ, {
          toValue: -1,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(packRotZ, {
          toValue: 0.7,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(packRotZ, {
          toValue: -0.7,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(packRotZ, {
          toValue: 0,
          duration: 55,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(packScale, {
          toValue: 1.1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(packScale, {
          toValue: 0.95,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(packScale, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(packGlow, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase('burst');

      // Trigger particle burst
      setParticleTrigger(true);
      const resetParticles = setTimeout(() => setParticleTrigger(false), 100);

      // 2. Flash + explode pack away
      Animated.sequence([
        Animated.timing(whiteFlash, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(whiteFlash, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(packScale, {
            toValue: 3.5,
            duration: 320,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(packOpacity, {
            toValue: 0,
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        clearTimeout(resetParticles);
        setPhase('revealed');

        // 3. Reveal cards
        Animated.parallel([
          Animated.timing(revealOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(revealY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }, [phase]);

  const reset = useCallback(() => {
    packScale.setValue(1);
    packRotZ.setValue(0);
    packOpacity.setValue(1);
    packGlow.setValue(0);
    whiteFlash.setValue(0);
    revealOpacity.setValue(0);
    revealY.setValue(30);
    setParticleTrigger(false);
    setPhase('idle');
  }, []);

  return (
    <View style={styles.root}>
      {/* ── Subtle grid bg ── */}
      <View style={styles.gridBg} pointerEvents="none" />

      <View style={styles.content}>
        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>POKÉMON TCG</Text>
          <Text style={styles.title}>Booster Opening</Text>
          <View style={styles.titleLine} />
        </View>

        {/* ═══════════ PACK PHASE ═══════════ */}
        {phase !== 'revealed' && (
          <View style={styles.packZone}>
            {/* Particles */}
            {PARTICLES.map((cfg, i) => (
              <Particle key={i} config={cfg} trigger={particleTrigger} />
            ))}

            {/* Ambient glow behind pack */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.packGlowRing,
                { opacity: glowOpacity },
              ]}
            />

            {/* White flash */}
            <Animated.View
              pointerEvents="none"
              style={[styles.flashOverlay, { opacity: whiteFlash }]}
            />

            {/* The pack */}
            <Animated.View
              style={{
                transform: [
                  { translateY: phase === 'idle' ? floatY : new Animated.Value(0) },
                  { scale: packScale },
                  { rotateZ: packRotZInterp },
                ],
                opacity: packOpacity,
              }}
            >
              <View style={styles.pack}>
                {/* Top section */}
                <View style={styles.packTop}>
                  {/* Holographic stripe */}
                  <View style={styles.packHoloStripe} />
                  <Text style={styles.packEditionLabel}>ÉDITION SPÉCIALE</Text>
                  <View style={styles.packBall}>
                    <Text style={styles.packBallEmoji}>⚡</Text>
                    {/* Ball inner glow ring */}
                    <View style={styles.packBallRing} />
                  </View>
                  <Text style={styles.packTitle}>POKÉMON</Text>
                </View>

                {/* Gold divider */}
                <View style={styles.packDivider} />

                {/* Bottom section */}
                <View style={styles.packBottom}>
                  {/* Type icons */}
                  <View style={styles.packTypes}>
                    {['🌿', '🔥', '💧', '⚡'].map((e, i) => (
                      <View key={i} style={styles.packTypeIcon}>
                        <Text style={styles.packTypeEmoji}>{e}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.packCardCount}>5 CARTES RARES</Text>

                  {/* Decorative dots */}
                  <View style={styles.packDots}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.packDot,
                          { opacity: 0.2 + i * 0.15 },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Shine overlay */}
                <View style={styles.packShineOverlay} pointerEvents="none" />
              </View>
            </Animated.View>
          </View>
        )}

        {/* ─── Button / status ─── */}
        {phase !== 'revealed' && (
          <View style={styles.buttonBlock}>
            <Pressable
              onPress={openBooster}
              disabled={phase !== 'idle'}
              style={({ pressed }) => [
                styles.openBtn,
                pressed && { opacity: 0.85 },
                phase !== 'idle' && styles.openBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.openBtnText,
                  phase !== 'idle' && styles.openBtnTextDisabled,
                ]}
              >
                {phase === 'idle'
                  ? '✦  OUVRIR LE BOOSTER'
                  : 'OUVERTURE EN COURS…'}
              </Text>
            </Pressable>
            {phase === 'idle' && (
              <Text style={styles.hint}>Appuie pour révéler tes cartes</Text>
            )}
          </View>
        )}

        {/* ═══════════ REVEAL PHASE ═══════════ */}
        {phase === 'revealed' && (
          <Animated.View
            style={[
              styles.revealContainer,
              {
                opacity: revealOpacity,
                transform: [{ translateY: revealY }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.revealHeader}>
              <View style={styles.revealBadge}>
                <Text style={styles.revealBadgeText}>✦ BOOSTER OUVERT ✦</Text>
              </View>
              <Text style={styles.revealTitle}>Tes cartes</Text>
            </View>

            {/* Cards grid */}
            <View style={styles.grid}>
              {CARDS.map((card, i) => (
                <FlippableCard key={card.id} card={card} delay={i * 180} />
              ))}
            </View>

            {/* Reset */}
            <Pressable
              onPress={reset}
              style={({ pressed }) => [
                styles.resetBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.resetBtnText}>↩  OUVRIR UN AUTRE BOOSTER</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.void,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  // Title
  titleBlock: { alignItems: 'center', marginBottom: 36 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    color: P.cyan,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: P.text,
    letterSpacing: -0.5,
  },
  titleLine: {
    marginTop: 10,
    height: 2,
    width: 56,
    backgroundColor: P.gold,
    borderRadius: 1,
  },

  // Pack zone
  packZone: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 320,
    marginBottom: 8,
  },
  particle: {
    position: 'absolute',
  },
  packGlowRing: {
    position: 'absolute',
    width: 190,
    height: 290,
    borderRadius: 26,
    backgroundColor: P.gold,
    shadowColor: P.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 0,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    zIndex: 30,
  },

  // Pack card
  pack: {
    width: 170,
    height: 264,
    borderRadius: 24,
    backgroundColor: P.deep,
    borderWidth: 1.5,
    borderColor: '#2A2A6A',
    overflow: 'hidden',
    shadowColor: P.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 22,
  },
  packTop: {
    height: 120,
    backgroundColor: '#B02005',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  packHoloStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: P.gold,
    opacity: 0.6,
  },
  packEditionLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  packBall: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: P.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  packBallEmoji: { fontSize: 26 },
  packBallRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: 'rgba(255,220,80,0.35)',
  },
  packTitle: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.5)',
  },
  packDivider: {
    height: 2.5,
    backgroundColor: P.gold,
    shadowColor: P.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  packBottom: {
    flex: 1,
    backgroundColor: '#08081C',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
  packTypes: {
    flexDirection: 'row',
    gap: 6,
  },
  packTypeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#161640',
    borderWidth: 1,
    borderColor: '#2A2A58',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packTypeEmoji: { fontSize: 14 },
  packCardCount: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 2,
    color: P.muted,
  },
  packDots: { flexDirection: 'row', gap: 4 },
  packDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: P.gold,
  },
  packShineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },

  // Open button
  buttonBlock: { alignItems: 'center', marginTop: 32 },
  openBtn: {
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: P.gold,
    borderWidth: 2,
    borderColor: P.goldDark,
    shadowColor: P.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 16,
  },
  openBtnDisabled: {
    backgroundColor: P.surface,
    borderColor: P.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: P.void,
  },
  openBtnTextDisabled: { color: P.muted },
  hint: {
    marginTop: 12,
    fontSize: 11,
    color: P.muted,
    letterSpacing: 0.5,
  },

  // Reveal
  revealContainer: { width: '100%' },
  revealHeader: { alignItems: 'center', marginBottom: 20 },
  revealBadge: {
    backgroundColor: P.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.gold + '50',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  revealBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: P.gold,
  },
  revealTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: P.text,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Card
  cardWrapper: {
    width: '48%',
    marginBottom: 12,
    height: 210,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: '#0A0A2A',
    borderColor: '#2A2A6A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackInner: { alignItems: 'center' },
  cardBackBadge: {
    borderWidth: 1,
    borderColor: '#303070',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 16,
    backgroundColor: '#141438',
  },
  cardBackBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#4040A0',
  },
  cardBackCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#141438',
    borderWidth: 1.5,
    borderColor: '#3030A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackEmoji: { fontSize: 24 },

  rarityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 10,
  },
  rarityText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
  },
  cardImage: { width: 94, height: 94 },
  cardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '900',
    color: P.text,
    letterSpacing: 0.2,
  },
  cardNumber: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Reset
  resetBtn: {
    marginTop: 6,
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: P.surface,
    borderWidth: 1.5,
    borderColor: P.border,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: P.muted,
  },
});