import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StatusBar, Text, View, useWindowDimensions, } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  total_owned: number;
  rare_count: number;
  booster_count: number;
  total_cards: number;
  unique_owned: number;
};

type RecentCard = {
  name: string;
  card_id: string;
  image: string;
  rarity: string;
  category: string | null;
  illustrator: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
};

// ─── Rarity colors ───────────────────────────────────────────────────────────

const RARITY_BORDER: Record<string, string> = {
  'One Diamond': '#b0bec5',
  'Two Diamond': '#90a4ae',
  'Three Diamond': '#81c784',
  'Four Diamond': '#4db6ac',
  'One Shiny': '#4fc3f7',
  'One Star': '#29b6f6',
  'Two Star': '#9c6bff',
  'Three Star': '#7c4dff',
  'Two Shiny': '#f0c040',
  'Crown': '#ef5350',
};

const RARITY_LABEL: Record<string, string> = {
  'One Diamond': '◆',
  'Two Diamond': '◆◆',
  'Three Diamond': '◆◆◆',
  'Four Diamond': '◆◆◆◆',
  'One Shiny': '✦ SHINY',
  'One Star': '★',
  'Two Star': '★★',
  'Three Star': '★★★',
  'Two Shiny': '✦✦ SHINY',
  'Crown': '♛ CROWN',
};

const SHIMMER_RARITIES = new Set(['Two Star', 'Three Star', 'Two Shiny', 'Crown']);

function rarityBorder(rarity: string) {
  return RARITY_BORDER[rarity] ?? '#cbd5e1';
}

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

  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.16, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: color, opacity, borderRadius: 18,
      }}
    />
  );
}

// ─── RecentCardItem ───────────────────────────────────────────────────────────

function RecentCardItem({ card, index }: { card: RecentCard; index: number }) {
  const entryX = useRef(new Animated.Value(40)).current;
  const entryO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(entryX, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(entryO, { toValue: 1, duration: 340, useNativeDriver: true }),
      ]).start();
    }, index * 90);
    return () => clearTimeout(t);
  }, []);

  const border = rarityBorder(card.rarity);
  const label = RARITY_LABEL[card.rarity] ?? card.rarity;
  const isSpecial = SHIMMER_RARITIES.has(card.rarity);

  return (
    <Animated.View style={{
      transform: [{ translateX: entryX }],
      opacity: entryO,
      width: 130,
      marginRight: 12,
    }}>
      <View style={{
        borderRadius: 20, borderWidth: 2, borderColor: border,
        backgroundColor: '#ffffff', overflow: 'hidden',
        shadowColor: border, shadowOpacity: isSpecial ? 0.35 : 0.08,
        shadowRadius: 10, elevation: isSpecial ? 6 : 2,
      }}>
        {isSpecial && <Shimmer color={border} />}

        {/* Badge rareté */}
        <View style={{
          position: 'absolute', top: 7, left: 7, zIndex: 10,
          flexDirection: 'row', alignItems: 'center', gap: 3,
          backgroundColor: border + '22', borderRadius: 99,
          paddingHorizontal: 7, paddingVertical: 3,
          borderWidth: 1, borderColor: border,
        }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: border }} />
          <Text style={{ fontSize: 7, fontWeight: '900', letterSpacing: 0.8, color: border }}>
            {label}
          </Text>
        </View>

        {/* Image */}
        <View style={{
          margin: 8, marginTop: 28, borderRadius: 13,
          backgroundColor: '#F5F0DC', alignItems: 'center',
          justifyContent: 'center', height: 100,
        }}>
          <Image
            source={{ uri: `${card.image}/high.png` }}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </View>

        {/* Footer */}
        <View style={{ paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#0f172a' }} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
            {card.card_id}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{
      flex: 1,
      transform: [{ scale }],
      opacity,
    }}>
      <View style={{
        backgroundColor: accent ? '#C02A09' : '#ffffff',
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: accent ? '#C02A09' : '#E8E3C8',
        shadowColor: accent ? '#C02A09' : '#000',
        shadowOpacity: accent ? 0.2 : 0.05,
        shadowRadius: 10,
        elevation: accent ? 5 : 2,
      }}>
        <Text style={{
          fontSize: 26, fontWeight: '900',
          color: accent ? '#ffffff' : '#0f172a',
        }}>
          {value}
        </Text>
        <Text style={{
          marginTop: 4, fontSize: 11, fontWeight: '700',
          color: accent ? 'rgba(255,255,255,0.8)' : '#64748b',
          textAlign: 'center',
        }}>
          {label}
        </Text>
        {sub && (
          <Text style={{
            marginTop: 3, fontSize: 10,
            color: accent ? 'rgba(255,255,255,0.55)' : '#94a3b8',
          }}>
            {sub}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── ShortcutButton ───────────────────────────────────────────────────────────

function ShortcutButton({
  emoji,
  label,
  sublabel,
  onPress,
  accent,
  delay,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  accent?: boolean;
  delay: number;
}) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY }], opacity }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: 24,
          padding: 18,
          alignItems: 'center',
          backgroundColor: accent ? '#C02A09' : '#ffffff',
          borderWidth: 1,
          borderColor: accent ? '#C02A09' : '#E8E3C8',
          shadowColor: accent ? '#C02A09' : '#000',
          shadowOpacity: pressed ? 0.05 : accent ? 0.2 : 0.06,
          shadowRadius: 12,
          elevation: pressed ? 1 : accent ? 5 : 2,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 999,
          backgroundColor: accent ? 'rgba(255,255,255,0.18)' : '#FFCB05',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <Text style={{
          fontSize: 13, fontWeight: '900',
          color: accent ? '#ffffff' : '#0f172a',
          textAlign: 'center',
        }}>
          {label}
        </Text>
        <Text style={{
          marginTop: 3, fontSize: 11,
          color: accent ? 'rgba(255,255,255,0.65)' : '#94a3b8',
          textAlign: 'center',
        }}>
          {sublabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Greeting ────────────────────────────────────────────────────────────────

function getGreeting(name: string): { text: string; emoji: string } {
  const hour = new Date().getHours();
  const first = name.split(' ')[0];
  if (hour >= 5 && hour < 12) return { text: `Bonjour, ${first} !`, emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: `Bon après-midi, ${first} !`, emoji: '⚡' };
  if (hour >= 18 && hour < 22) return { text: `Bonsoir, ${first} !`, emoji: '🌙' };
  return { text: `Bonne nuit, ${first} !`, emoji: '🌙' };
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, radius = 12 }: { width: number | string; height: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={{
      width: width as any, height, borderRadius: radius,
      backgroundColor: '#E8E3C8', opacity,
    }} />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isPhone = width < 640;
  const sidePad = isPhone ? 16 : 24;
  const maxWidth = Math.min(width, 860);

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentCard[]>([]);
  const [loading, setLoading] = useState(true);

  const headerY = useRef(new Animated.Value(-20)).current;
  const headerO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerO, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [userRes, statsRes, recentRes] = await Promise.all([
        apiFetch('/api/me', token),
        apiFetch('/api/stats', token),
        apiFetch('/api/recent', token),
      ]);

      if (userRes.ok) setUser(await userRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (recentRes.ok) setRecent(await recentRes.json());
    } catch (e) {
      console.error('Home load error:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const greeting = useMemo(
    () => getGreeting(user?.name ?? 'Dresseur'),
    [user]
  );

  const completionPct = stats && stats.total_cards > 0
    ? Math.round((stats.unique_owned / stats.total_cards) * 100)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0DC' }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          paddingTop: 24,
          paddingBottom: 48,
          alignSelf: 'center',
          width: '100%',
          maxWidth: maxWidth,
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero / Greeting ── */}
        <Animated.View style={{ transform: [{ translateY: headerY }], opacity: headerO }}>
          <View style={{
            borderRadius: 28, borderWidth: 1, borderColor: '#E8E3C8',
            backgroundColor: '#ffffff', padding: isPhone ? 18 : 22,
            marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, color: '#C02A09', textTransform: 'uppercase' }}>
                  Pokémon TCG
                </Text>

                {loading || !user ? (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <SkeletonBlock width={200} height={28} radius={8} />
                    <SkeletonBlock width={140} height={16} radius={6} />
                  </View>
                ) : (
                  <>
                    <Text style={{ marginTop: 5, fontSize: isPhone ? 22 : 26, fontWeight: '900', color: '#0f172a' }}>
                      {greeting.emoji}  {greeting.text}
                    </Text>
                    <Text style={{ marginTop: 5, fontSize: 13, color: '#64748b', fontWeight: '600' }}>
                      {user.email}
                    </Text>
                  </>
                )}
              </View>

              <View style={{
                width: isPhone ? 56 : 64, height: isPhone ? 56 : 64,
                borderRadius: 999, backgroundColor: '#FFCB05',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: isPhone ? 26 : 30 }}>🎴</Text>
              </View>
            </View>

            {/* Barre de complétion Pokédex */}
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
                  Progression Pokédex
                </Text>
                {loading ? (
                  <SkeletonBlock width={40} height={14} radius={4} />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#C02A09' }}>
                    {completionPct}%
                  </Text>
                )}
              </View>

              {/* Track */}
              <View style={{
                height: 8, borderRadius: 99,
                backgroundColor: '#F5F0DC', overflow: 'hidden',
              }}>
                {!loading && (
                  <View style={{
                    height: '100%',
                    width: `${completionPct}%`,
                    borderRadius: 99,
                    backgroundColor: completionPct >= 80 ? '#FFCB05' : '#C02A09',
                  }} />
                )}
              </View>

              {!loading && stats && (
                <Text style={{ marginTop: 5, fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>
                  {stats.unique_owned} / {stats.total_cards} cartes uniques
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Stats ── */}
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a', marginBottom: 10, letterSpacing: 0.5 }}>
          MES STATISTIQUES
        </Text>

        {loading ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ flex: 1, height: 96, borderRadius: 22, overflow: 'hidden' }}>
                <SkeletonBlock width="100%" height={96} radius={22} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <StatCard
              label="Boosters ouverts"
              value={stats?.booster_count ?? 0}
              accent
              delay={0}
            />
            <StatCard
              label="Cartes possédées"
              value={stats?.total_owned ?? 0}
              sub={`${stats?.unique_owned ?? 0} uniques`}
              delay={80}
            />
            <StatCard
              label="Rares obtenues"
              value={stats?.rare_count ?? 0}
              delay={160}
            />
          </View>
        )}

        {/* ── Shortcuts ── */}
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a', marginBottom: 10, letterSpacing: 0.5 }}>
          RACCOURCIS
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <ShortcutButton
            emoji="🎴"
            label="Ouvrir"
            sublabel="un booster"
            accent
            delay={100}
            onPress={() => router.push('/(tabs)/booster')}
          />
          <ShortcutButton
            emoji="📖"
            label="Pokédex"
            sublabel="Toutes les cartes"
            delay={180}
            onPress={() => router.push('/(tabs)/pokedex')}
          />
          <ShortcutButton
            emoji="⭐"
            label="Collection"
            sublabel="Mes cartes"
            delay={260}
            onPress={() => router.push('/(tabs)/pokedex')}
          />
        </View>

        {/* ── Dernières cartes obtenues ── */}
        {(loading || recent.length > 0) && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 }}>
                DERNIÈRES CARTES
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/pokedex')}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#C02A09' }}>
                  Voir tout →
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 130 }}>
                    <SkeletonBlock width={130} height={190} radius={20} />
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: sidePad }}
              >
                {recent.map((card, i) => (
                  <RecentCardItem key={card.card_id + i} card={card} index={i} />
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Empty state — aucun booster ouvert */}
        {!loading && stats?.booster_count === 0 && (
          <View style={{
            marginTop: 8,
            borderRadius: 24, borderWidth: 1, borderColor: '#E8E3C8',
            backgroundColor: 'rgba(255,255,255,0.7)',
            padding: 28, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🎴</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 6 }}>
              Prêt à commencer ?
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, maxWidth: 240 }}>
              Ouvre ton premier booster et découvre tes cartes rares !
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/booster')}
              style={{
                backgroundColor: '#C02A09', borderRadius: 999,
                paddingVertical: 14, paddingHorizontal: 32,
                shadowColor: '#C02A09', shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 }}>
                ✦  OUVRIR UN BOOSTER
              </Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
