import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';



// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'shaking' | 'burst' | 'revealed';

type Card = {
  name: string;
  card_id: string;
  image: string;
  category: string;
  rarity: string;
  illustrator: string;
};

type RarityConfig = {
  label: string;
  textColor: string;
  cardBorder: string;
  shimmer: boolean;
};

// ─── Rarity configs ──────────────────────────────────────────────────────────

const RARITY_CONFIGS: Record<string, RarityConfig> = {
  'One Diamond': { label: '◆', textColor: '#90a4ae', cardBorder: '#b0bec5', shimmer: false },
  'Two Diamond': { label: '◆◆', textColor: '#607d8b', cardBorder: '#90a4ae', shimmer: false },
  'Three Diamond': { label: '◆◆◆', textColor: '#2e7d32', cardBorder: '#81c784', shimmer: false },
  'Four Diamond': { label: '◆◆◆◆', textColor: '#00695c', cardBorder: '#4db6ac', shimmer: false },
  'One Shiny': { label: '✦ SHINY', textColor: '#0277bd', cardBorder: '#4fc3f7', shimmer: false },
  'One Star': { label: '★', textColor: '#01579b', cardBorder: '#29b6f6', shimmer: false },
  'Two Star': { label: '★★', textColor: '#6d28d9', cardBorder: '#9c6bff', shimmer: true },
  'Three Star': { label: '★★★', textColor: '#5b21b6', cardBorder: '#7c4dff', shimmer: true },
  'Two Shiny': { label: '✦✦ SHINY', textColor: '#b45309', cardBorder: '#f0c040', shimmer: true },
  'Crown': { label: '♛ CROWN', textColor: '#b91c1c', cardBorder: '#ef5350', shimmer: true },
};

const RARE_RARITIES = new Set(['Two Star', 'Three Star', 'Two Shiny', 'Crown', 'One Star']);

function rarityConfig(rarity: string): RarityConfig {
  return RARITY_CONFIGS[rarity] ?? {
    label: rarity.toUpperCase(),
    textColor: '#64748b',
    cardBorder: '#cbd5e1',
    shimmer: false,
  };
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

// ─── Shimmer ─────────────────────────────────────────────────────────────────

function Shimmer({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.18, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity, borderRadius: 20 }]}
    />
  );
}

// ─── Particle ────────────────────────────────────────────────────────────────

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
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: config.color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    />
  );
}

// ─── Float hook ──────────────────────────────────────────────────────────────

function useFloatAnim() {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  return floatY;
}

// ─── FlippableCard ────────────────────────────────────────────────────────────

function FlippableCard({
  card,
  delay,
  cardWidth,
  cardHeight,
  gap
}: {
  card: Card;
  delay: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
}) {
  const flip = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.6)).current;
  const entryY = useRef(new Animated.Value(40)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const cfg = useMemo(() => rarityConfig(card.rarity), [card.rarity]);
  const isSpecial = cfg.shimmer;
  const imageSize = Math.max(64, Math.min(cardWidth * 0.62, 110));

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
  }, [delay]);

  const backRotateY = flip.interpolate({ inputRange: [0, 90, 180], outputRange: ['0deg', '90deg', '90deg'] });
  const backOpacity = flip.interpolate({ inputRange: [0, 89, 90], outputRange: [1, 1, 0] });
  const frontRotateY = flip.interpolate({ inputRange: [0, 90, 180], outputRange: ['-90deg', '-90deg', '0deg'] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 89, 90], outputRange: [0, 0, 1] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  const titleFont = cardWidth < 140 ? 11 : 13;
  const idFont = cardWidth < 140 ? 9 : 10;

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          height: cardHeight,
          marginBottom: 12,
          marginHorizontal: gap / 2,
        }, { transform: [{ scale: entryScale }, { translateY: entryY }, ...(isSpecial ? [{ scale: glowScale }] : [])] },
      ]}
    >
      {/* ── Dos ── */}
      <Animated.View style={[StyleSheet.absoluteFill, {
        borderRadius: 20, borderWidth: 2, borderColor: '#E8E3C8',
        backgroundColor: '#FAFAF7', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', opacity: backOpacity,
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
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFCB05', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>⚡</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Face ── */}
      <Animated.View style={[StyleSheet.absoluteFill, {
        borderRadius: 20, borderWidth: 2, borderColor: cfg.cardBorder,
        backgroundColor: '#ffffff', overflow: 'hidden',
        opacity: frontOpacity,
        transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
        shadowColor: cfg.cardBorder, shadowOpacity: isSpecial ? 0.45 : 0,
        shadowRadius: 12, elevation: isSpecial ? 8 : 0,
      }]}>
        {cfg.shimmer && <Shimmer color={cfg.cardBorder} />}

        {/* Badge rareté */}
        <View style={{
          position: 'absolute', top: 8, left: 8, zIndex: 10,
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: cfg.textColor + '18', borderRadius: 20,
          paddingHorizontal: 7, paddingVertical: 3,
          borderWidth: 1, borderColor: cfg.cardBorder,
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: cfg.textColor }} />
          <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 1, color: cfg.textColor }}>{cfg.label}</Text>
        </View>

        {/* Image */}
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          paddingTop: 26, backgroundColor: '#F5F0DC', margin: 7, borderRadius: 13,
        }}>
          <Image
            source={{ uri: `${card.image}/high.png` }}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
          />
        </View>

        {/* Footer */}
        <View style={{ padding: 9, borderTopWidth: 1, borderTopColor: '#E8E3C8' }}>
          <Text style={{ fontSize: titleFont, fontWeight: '900', color: '#0f172a' }} numberOfLines={1}>{card.name}</Text>
          <Text style={{ fontSize: idFont, fontWeight: '700', color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{card.card_id}</Text>
          {card.illustrator ? (
            <Text style={{ fontSize: 9, color: '#cbd5e1', marginTop: 1 }} numberOfLines={1}>✦ {card.illustrator}</Text>
          ) : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BoosterOpening() {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const pageMaxWidth = isDesktop ? 1120 : isTablet ? 860 : width;
  const sidePadding = isPhone ? 16 : 24;
  const columns = isDesktop ? 5 : isTablet ? 3 : 2;
  const gap = isPhone ? 12 : 16;
  const usableWidth = pageMaxWidth - sidePadding * 2;
  const cardWidth = Math.min(
    (usableWidth / columns) - gap,
    190
  );
  const cardHeight = cardWidth * 1.02;
  const packWidth = isDesktop ? 200 : isTablet ? 185 : 170;
  const packHeight = isDesktop ? 310 : isTablet ? 286 : 264;
  const stageW = isDesktop ? 320 : 260;
  const stageH = isDesktop ? 430 : 360;

  const [phase, setPhase] = useState<Phase>('idle');
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [boosterCount, setBoosterCount] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" />

      <View style={{
        flex: 1,
        alignSelf: 'center',
        width: '100%',
        maxWidth: pageMaxWidth,
        paddingHorizontal: sidePadding,
        paddingTop: 26,
        paddingBottom: 18,
      }}>

        {/* ── Header ── */}
        <View style={{
          borderWidth: 1, borderColor: theme.border,
          backgroundColor: theme.surface, borderRadius: 28,
          padding: isPhone ? 18 : 22, marginBottom: 20,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, color: theme.primary, textTransform: 'uppercase' }}>
                Pokémon TCG
              </Text>
              <Text style={{ marginTop: 4, fontSize: isPhone ? 24 : 28, fontWeight: '900', color: '#0f172a' }}>
                Booster Opening
              </Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: '#64748b', fontWeight: '600' }}>
                Ouvre ton booster et découvre tes cartes rares
              </Text>
            </View>
            <View style={{
              width: isPhone ? 56 : 64, height: isPhone ? 56 : 64,
              borderRadius: 999, backgroundColor: theme.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: isPhone ? 26 : 30 }}>🎴</Text>
            </View>
          </View>

          {boosterCount > 0 && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 18, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a' }}>{boosterCount}</Text>
                <Text style={{ marginTop: 3, fontSize: 11, fontWeight: '700', color: '#64748b' }}>Boosters ouverts</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 18, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a' }}>{rareCount}</Text>
                <Text style={{ marginTop: 3, fontSize: 11, fontWeight: '700', color: '#64748b' }}>Rares obtenus</Text>
              </View>
            </View>
          )}
        </View>

        {/* ════════ PACK PHASE ════════ */}
        {phase !== 'revealed' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

            <View style={{ alignItems: 'center', justifyContent: 'center', width: stageW, height: stageH, marginBottom: 8 }}>

              {PARTICLES.map((cfg, i) => <Particle key={i} config={cfg} trigger={particleTrigger} />)}

              {/* Halo */}
              <Animated.View pointerEvents="none" style={{
                position: 'absolute',
                width: packWidth + 50, height: packHeight + 50,
                borderRadius: 30, backgroundColor: theme.accent,
                opacity: glowOpacity,
                shadowColor: theme.accent, shadowOpacity: 1, shadowRadius: 40,
              }} />

              {/* Flash blanc */}
              <Animated.View pointerEvents="none" style={{
                position: 'absolute',
                width: packWidth + 60, height: packHeight + 60,
                backgroundColor: '#ffffff', borderRadius: 30,
                zIndex: 30, opacity: whiteFlash,
              }} />

              {/* Pack */}
              <Animated.View style={{
                transform: [
                  { translateY: phase === 'idle' ? floatY : 0 },
                  { scale: packScale },
                  { rotateZ: packRotZInterp },
                ],
                opacity: packOpacity,
              }}>
                <View style={{
                  width: packWidth, height: packHeight,
                  borderRadius: 26, backgroundColor: theme.surface,
                  borderWidth: 1.5, borderColor: theme.border,
                  overflow: 'hidden',
                  shadowColor: theme.primary, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
                }}>
                  {/* Zone primaire */}
                  <View style={{
                    height: packHeight * 0.45,
                    backgroundColor: theme.primary,
                    alignItems: 'center', justifyContent: 'center', paddingTop: 12,
                  }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: theme.accent, opacity: 0.8 }} />
                    <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 2.5, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                      ÉDITION SPÉCIALE
                    </Text>
                    <View style={{
                      width: isPhone ? 54 : 58, height: isPhone ? 54 : 58,
                      borderRadius: 999, backgroundColor: theme.accent,
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: theme.accent, shadowOpacity: 1, shadowRadius: 18, elevation: 10,
                    }}>
                      <Text style={{ fontSize: isPhone ? 26 : 28 }}>⚡</Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: isPhone ? 9 : 10, fontWeight: '900', letterSpacing: 3, color: 'rgba(255,255,255,0.5)' }}>
                      POKÉMON
                    </Text>
                  </View>

                  {/* Séparateur */}
                  <View style={{ height: 2.5, backgroundColor: theme.accent }} />

                  {/* Zone bg */}
                  <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['🌿', '🔥', '💧', '⚡'].map((e, i) => (
                        <View key={i} style={{
                          width: isPhone ? 30 : 34, height: isPhone ? 30 : 34,
                          borderRadius: 999, backgroundColor: theme.surface,
                          borderWidth: 1, borderColor: theme.border,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: isPhone ? 14 : 15 }}>{e}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 2, color: '#94a3b8' }}>5 CARTES RARES</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <View key={i} style={{
                          width: 5, height: 5, borderRadius: 2.5,
                          backgroundColor: theme.primary, opacity: 0.2 + i * 0.15,
                        }} />
                      ))}
                    </View>
                  </View>

                  {/* Reflet */}
                  <View pointerEvents="none" style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '45%', height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)',
                  }} />
                </View>
              </Animated.View>
            </View>

            {/* Bouton ouvrir */}
            <View style={{ alignItems: 'center', marginTop: 18 }}>
              <Pressable
                onPress={handleOpen}
                disabled={phase !== 'idle'}
                style={{
                  minWidth: isPhone ? 240 : 280,
                  borderRadius: 999, paddingVertical: 16, paddingHorizontal: 28,
                  backgroundColor: phase !== 'idle' ? '#E2E8F0' : theme.primary,
                  alignItems: 'center',
                  borderWidth: phase !== 'idle' ? 1 : 0, borderColor: '#CBD5E1',
                  shadowColor: phase === 'idle' ? theme.primary : 'transparent',
                  shadowOpacity: phase === 'idle' ? 0.2 : 0,
                  shadowRadius: 14, elevation: phase === 'idle' ? 5 : 0,
                }}
              >
                <Text style={{
                  fontSize: 13, fontWeight: '900', letterSpacing: 1.5,
                  color: phase !== 'idle' ? '#64748b' : '#ffffff',
                }}>
                  {phase === 'idle' ? '✦  OUVRIR LE BOOSTER' : 'OUVERTURE EN COURS…'}
                </Text>
              </Pressable>

              {phase === 'idle' && (
                <Text style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>
                  {boosterCount === 0
                    ? 'Appuie pour révéler tes cartes'
                    : `${boosterCount} booster${boosterCount > 1 ? 's' : ''} ouvert${boosterCount > 1 ? 's' : ''}`}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ════════ REVEAL PHASE ════════ */}
        {phase === 'revealed' && (
          <Animated.View style={{ flex: 1, opacity: revealOpacity, transform: [{ translateY: revealY }] }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Titre reveal */}
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={{
                  borderRadius: 16, borderWidth: 1, borderColor: theme.border,
                  backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, color: theme.primary }}>
                    ✦ BOOSTER OUVERT ✦
                  </Text>
                </View>
                <Text style={{ fontSize: isPhone ? 22 : 26, fontWeight: '900', color: '#0f172a' }}>
                  {cards.length} carte{cards.length > 1 ? 's' : ''} obtenue{cards.length > 1 ? 's' : ''}
                </Text>
              </View>

              {/* Grille */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -gap / 2,
                justifyContent: isDesktop ? 'flex-start' : 'space-between',
              }}>
                {cards.map((card, i) => (
                  <FlippableCard
                    key={`${card.card_id}-${i}`}
                    card={card}
                    delay={i * 180}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    gap={gap}
                  />
                ))}
              </View>

              {/* Bouton reset */}
              <Pressable
                onPress={resetAll}
                style={{
                  marginTop: 14, paddingVertical: 16,
                  borderRadius: 24, borderWidth: 1, borderColor: theme.border,
                  backgroundColor: theme.surface, alignItems: 'center',
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 1.3, color: '#64748b' }}>
                  ↩  OUVRIR UN AUTRE BOOSTER
                </Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        )}

      </View>
    </View>
  );
}
