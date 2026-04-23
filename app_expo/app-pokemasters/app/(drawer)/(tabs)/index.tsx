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
  Text,
  View,
  StatusBar,
  StyleSheet,
} from 'react-native';

const { width: SW } = Dimensions.get('window');

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
  { id: 1,   name: 'Bulbizarre', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',   rarity: 'Common' },
  { id: 4,   name: 'Salamèche', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',   rarity: 'Common' },
  { id: 7,   name: 'Carapuce',  image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',   rarity: 'Rare' },
  { id: 25,  name: 'Pikachu',   image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',  rarity: 'Ultra Rare' },
  { id: 150, name: 'Mewtwo',    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png', rarity: 'Secret' },
];

// ─── Rarity config ───────────────────────────────────────────────────────────
function rarityConfig(r: Rarity) {
  switch (r) {
    case 'Common':    return { label: 'COMMUN',     bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400',  textColor: '#64748b', cardBorder: '#cbd5e1', shimmer: false };
    case 'Rare':      return { label: 'RARE',       bg: 'bg-blue-100',   border: 'border-blue-200',   dot: 'bg-blue-500',   textColor: '#3b82f6', cardBorder: '#93c5fd', shimmer: false };
    case 'Ultra Rare':return { label: 'ULTRA RARE', bg: 'bg-amber-100',  border: 'border-amber-200',  dot: 'bg-amber-400',  textColor: '#f59e0b', cardBorder: '#fcd34d', shimmer: true  };
    case 'Secret':    return { label: 'SECRET',     bg: 'bg-violet-100', border: 'border-violet-200', dot: 'bg-violet-500', textColor: '#8b5cf6', cardBorder: '#c4b5fd', shimmer: true  };
  }
}

// ─── Particles ───────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 20;
const PARTICLE_COLORS = ['#C02A09', '#FFCB05', '#F5F0DC', '#ef4444', '#f97316', '#ffffff', '#fbbf24'];
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

function Particle({ config, trigger }: { config: typeof PARTICLES[0]; trigger: boolean }) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    tx.setValue(0); ty.setValue(0); opacity.setValue(0); scale.setValue(0);
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 100, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(tx, { toValue: config.destX, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(ty, { toValue: config.destY, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        ]),
      ]).start();
    }, config.delay);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
      position: 'absolute', width: config.size, height: config.size,
      borderRadius: config.size / 2, backgroundColor: config.color,
      opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale }],
    }]} />
  );
}

// ─── Shimmer (Ultra Rare / Secret) ───────────────────────────────────────────
function Shimmer({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.18, 0] });
  return (
    <Animated.View pointerEvents="none"
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
        Animated.timing(entryScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(entryY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(flip, { toValue: 180, duration: 550, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
            .start(() => {
              if (isSpecial) {
                Animated.loop(Animated.sequence([
                  Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: true }),
                  Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ])).start();
              }
            });
        }, 80);
      });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const backRotateY = flip.interpolate({ inputRange: [0, 90, 180], outputRange: ['0deg', '90deg', '90deg'] });
  const backOpacity = flip.interpolate({ inputRange: [0, 89, 90], outputRange: [1, 1, 0] });
  const frontRotateY = flip.interpolate({ inputRange: [0, 90, 180], outputRange: ['-90deg', '-90deg', '0deg'] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 89, 90], outputRange: [0, 0, 1] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  const CARD_W = (SW - 52) / 3;
  const CARD_H = CARD_W * 1;

  return (
    <Animated.View style={[{ width: CARD_W, height: CARD_H, marginBottom: 12 }, {
      transform: [
        { scale: entryScale }, { translateY: entryY },
        ...(isSpecial ? [{ scale: glowScale }] : []),
      ],
    }]}>
      {/* Back */}
      <Animated.View style={[StyleSheet.absoluteFill, {
        borderRadius: 20, borderWidth: 2, borderColor: '#E8E3C8',
        backgroundColor: '#FAFAF7', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: backOpacity,
        transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
      }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            borderWidth: 1, borderColor: '#E8E3C8', borderRadius: 8,
            paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
            backgroundColor: '#F5F0DC',
          }}>
            <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 3, color: '#C02A09' }}>TCG</Text>
          </View>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: '#FFCB05', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 26 }}>⚡</Text>
          </View>
        </View>
      </Animated.View>

      {/* Front */}
      <Animated.View style={[StyleSheet.absoluteFill, {
        borderRadius: 20, borderWidth: 2, borderColor: cfg.cardBorder,
        backgroundColor: '#ffffff', overflow: 'hidden',
        opacity: frontOpacity,
        transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
        shadowColor: cfg.cardBorder, shadowOpacity: isSpecial ? 0.5 : 0,
        shadowRadius: 12, elevation: isSpecial ? 8 : 0,
      }]}>
        {cfg.shimmer && <Shimmer color={cfg.cardBorder} />}

        {/* Rarity badge */}
        <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: cfg.textColor + '18', borderRadius: 20,
          paddingHorizontal: 8, paddingVertical: 3,
          borderWidth: 1, borderColor: cfg.cardBorder,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.textColor }} />
          <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 1, color: cfg.textColor }}>
            {cfg.label}
          </Text>
        </View>

        {/* Image */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
          paddingTop: 28, backgroundColor: '#F5F0DC', margin: 8, borderRadius: 14 }}>
          <Image source={{ uri: card.image }} style={{ width: 90, height: 90 }} resizeMode="contain" />
        </View>

        {/* Footer */}
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: '#E8E3C8' }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a' }} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 2 }}>
            #{String(card.id).padStart(3, '0')}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Float hook ───────────────────────────────────────────────────────────────
function useFloatAnim() {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 8,  duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    return () => floatY.stopAnimation();
  }, []);
  return floatY;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BoosterOpening() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [particleTrigger, setParticleTrigger] = useState(false);

  const packScale   = useRef(new Animated.Value(1)).current;
  const packRotZ    = useRef(new Animated.Value(0)).current;
  const packOpacity = useRef(new Animated.Value(1)).current;
  const packGlow    = useRef(new Animated.Value(0)).current;
  const whiteFlash  = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealY       = useRef(new Animated.Value(30)).current;
  const floatY = useFloatAnim();

  const packRotZInterp = packRotZ.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-6deg', '0deg', '6deg'] });
  const glowOpacity    = packGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  const openBooster = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('shaking');

    Animated.parallel([
      Animated.sequence([
        Animated.timing(packRotZ, { toValue: 1,    duration: 55, useNativeDriver: true }),
        Animated.timing(packRotZ, { toValue: -1,   duration: 55, useNativeDriver: true }),
        Animated.timing(packRotZ, { toValue: 0.7,  duration: 55, useNativeDriver: true }),
        Animated.timing(packRotZ, { toValue: -0.7, duration: 55, useNativeDriver: true }),
        Animated.timing(packRotZ, { toValue: 0,    duration: 55, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(packScale, { toValue: 1.1,  duration: 160, useNativeDriver: true }),
        Animated.timing(packScale, { toValue: 0.95, duration: 130, useNativeDriver: true }),
        Animated.timing(packScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      ]),
      Animated.timing(packGlow, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setPhase('burst');
      setParticleTrigger(true);
      const reset = setTimeout(() => setParticleTrigger(false), 100);

      Animated.sequence([
        Animated.timing(whiteFlash, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(whiteFlash, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(packScale,  { toValue: 3.5, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(packOpacity,{ toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start(() => {
        clearTimeout(reset);
        setPhase('revealed');
        Animated.parallel([
          Animated.timing(revealOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(revealY,       { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      });
    });
  }, [phase]);

  const resetAll = useCallback(() => {
    packScale.setValue(1); packRotZ.setValue(0); packOpacity.setValue(1);
    packGlow.setValue(0);  whiteFlash.setValue(0);
    revealOpacity.setValue(0); revealY.setValue(30);
    setParticleTrigger(false);
    setPhase('idle');
  }, []);

  return (
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 }}>

        {/* ── Header ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white w-full p-5 mb-8" style={{ elevation: 2 }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
                Pokémon TCG
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900">
                Booster Opening
              </Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
              <Text className="text-2xl">🎴</Text>
            </View>
          </View>
        </View>

        {/* ════════ PACK PHASE ════════ */}
        {phase !== 'revealed' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: 220, height: 320, marginBottom: 8 }}>

            {/* Particles */}
            {PARTICLES.map((cfg, i) => <Particle key={i} config={cfg} trigger={particleTrigger} />)}

            {/* Glow ring */}
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              borderRadius: 26, backgroundColor: '#FFCB05', opacity: glowOpacity,
              shadowColor: '#FFCB05', shadowOpacity: 1, shadowRadius: 40,
            }]} />

            {/* Flash */}
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              backgroundColor: '#ffffff', borderRadius: 26, zIndex: 30, opacity: whiteFlash,
            }]} />

            {/* Pack */}
            <Animated.View style={{
              transform: [
                { translateY: phase === 'idle' ? floatY : new Animated.Value(0) },
                { scale: packScale },
                { rotateZ: packRotZInterp },
              ],
              opacity: packOpacity,
            }}>
              <View style={{
                width: 170, height: 264, borderRadius: 24,
                backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#E8E3C8',
                overflow: 'hidden',
                shadowColor: '#C02A09', shadowOpacity: 0.25, shadowRadius: 22, elevation: 12,
              }}>
                {/* Top rouge */}
                <View style={{ height: 120, backgroundColor: '#C02A09', alignItems: 'center', justifyContent: 'center', paddingTop: 12 }}>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#FFCB05', opacity: 0.8 }} />
                  <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 2.5, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                    ÉDITION SPÉCIALE
                  </Text>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFCB05', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFCB05', shadowOpacity: 1, shadowRadius: 18, elevation: 10 }}>
                    <Text style={{ fontSize: 26 }}>⚡</Text>
                  </View>
                  <Text style={{ marginTop: 6, fontSize: 9, fontWeight: '900', letterSpacing: 3, color: 'rgba(255,255,255,0.5)' }}>POKÉMON</Text>
                </View>

                {/* Divider doré */}
                <View style={{ height: 2.5, backgroundColor: '#FFCB05' }} />

                {/* Bottom crème */}
                <View style={{ flex: 1, backgroundColor: '#FAFAF7', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['🌿','🔥','💧','⚡'].map((e, i) => (
                      <View key={i} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F0DC', borderWidth: 1, borderColor: '#E8E3C8', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14 }}>{e}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 2, color: '#94a3b8' }}>5 CARTES RARES</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#C02A09', opacity: 0.2 + i * 0.15 }} />
                    ))}
                  </View>
                </View>

                {/* Shine */}
                <View style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' }} pointerEvents="none" />
              </View>
            </Animated.View>
          </View>
        )}

        {/* ── Bouton ── */}
        {phase !== 'revealed' && (
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Pressable
              onPress={openBooster}
              disabled={phase !== 'idle'}
              className={`rounded-3xl py-4 px-10 ${phase !== 'idle' ? 'bg-slate-100 border border-slate-200' : 'bg-[#C02A09]'}`}
              style={{ elevation: phase === 'idle' ? 6 : 0 }}
            >
              <Text className={`text-sm font-black tracking-widest ${phase !== 'idle' ? 'text-slate-400' : 'text-white'}`}>
                {phase === 'idle' ? '✦  OUVRIR LE BOOSTER' : 'OUVERTURE EN COURS…'}
              </Text>
            </Pressable>
            {phase === 'idle' && (
              <Text className="mt-3 text-xs text-slate-400 font-semibold">
                Appuie pour révéler tes cartes
              </Text>
            )}
          </View>
        )}

        {/* ════════ REVEAL PHASE ════════ */}
        {phase === 'revealed' && (
          <Animated.ScrollView
            style={{ width: '100%', opacity: revealOpacity }}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header reveal */}
            <View className="items-center mb-5">
              <View className="rounded-2xl border border-[#E8E3C8] bg-white px-4 py-2 mb-2">
                <Text className="text-[10px] font-black tracking-widest text-[#C02A09]">
                  ✦ BOOSTER OUVERT ✦
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">Tes cartes</Text>
            </View>

            {/* Grille */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {CARDS.map((card, i) => (
                <FlippableCard key={card.id} card={card} delay={i * 180} />
              ))}
            </View>

            {/* Reset */}
            <Pressable
              onPress={resetAll}
              className="mt-2 py-4 rounded-3xl border border-[#E8E3C8] bg-white items-center"
              style={{ elevation: 2 }}
            >
              <Text className="text-xs font-black tracking-widest text-slate-500">
                ↩  OUVRIR UN AUTRE BOOSTER
              </Text>
            </Pressable>
          </Animated.ScrollView>
        )}

      </View>
    </View>
  );
}