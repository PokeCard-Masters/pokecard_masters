import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Region = {
    key: string;
    label: string;
    emoji: string;
    primary: string;
    secondary: string;
    accent: string;
    description: string;
};

type UserProfile = {
    id: number;
    name: string;
    email: string;
    region: string;
};

type Stats = {
    total_owned: number;
    rare_count: number;
    booster_count: number;
    total_cards: number;
    unique_owned: number;
};

// ─── Régions ──────────────────────────────────────────────────────────────────

const REGIONS: Region[] = [
    {
        key: 'Kanto',
        label: 'Kanto',
        emoji: '🔴',
        primary: '#C02A09',
        secondary: '#7f1d1d',
        accent: '#FFCB05',
        description: 'La région originelle, terre des premiers dresseurs.',
    },
    {
        key: 'Johto',
        label: 'Johto',
        emoji: '🌙',
        primary: '#6d28d9',
        secondary: '#3b0764',
        accent: '#c4b5fd',
        description: 'Région mystérieuse entre tradition et légendes.',
    },
    {
        key: 'Hoenn',
        label: 'Hoenn',
        emoji: '🌊',
        primary: '#0277bd',
        secondary: '#01579b',
        accent: '#4fc3f7',
        description: 'Archipel tropical baigné par les flots.',
    },
    {
        key: 'Sinnoh',
        label: 'Sinnoh',
        emoji: '❄️',
        primary: '#1e40af',
        secondary: '#1e3a8a',
        accent: '#93c5fd',
        description: 'Terres glaciales abritant les Pokémon Légendaires du temps.',
    },
    {
        key: 'Unova',
        label: 'Unova',
        emoji: '🏙️',
        primary: '#334155',
        secondary: '#0f172a',
        accent: '#94a3b8',
        description: 'Métropole moderne, région de contrastes.',
    },
    {
        key: 'Kalos',
        label: 'Kalos',
        emoji: '🌸',
        primary: '#be185d',
        secondary: '#831843',
        accent: '#f9a8d4',
        description: 'Région de la beauté et de la Méga-Évolution.',
    },
    {
        key: 'Alola',
        label: 'Alola',
        emoji: '🌺',
        primary: '#ea580c',
        secondary: '#9a3412',
        accent: '#fdba74',
        description: 'Îles ensoleillées et culture unique.',
    },
    {
        key: 'Galar',
        label: 'Galar',
        emoji: '⚔️',
        primary: '#15803d',
        secondary: '#14532d',
        accent: '#86efac',
        description: 'Région industrielle et championnats Dynamax.',
    },
    {
        key: 'Paldea',
        label: 'Paldea',
        emoji: '✨',
        primary: '#b45309',
        secondary: '#78350f',
        accent: '#fcd34d',
        description: 'Vaste terre ouverte, berceau de la Téracristalisation.',
    },
];

function getRegion(key: string): Region {
    return REGIONS.find(r => r.key === key) ?? REGIONS[0];
}

// ─── Rang dresseur ────────────────────────────────────────────────────────────

type Rank = { label: string; emoji: string; min: number; color: string };

const RANKS: Rank[] = [
    { label: 'Novice', emoji: '🌱', min: 0, color: '#64748b' },
    { label: 'Rookie', emoji: '⚡', min: 5, color: '#0277bd' },
    { label: 'Exploreur', emoji: '🔥', min: 15, color: '#ea580c' },
    { label: 'Expert', emoji: '💎', min: 30, color: '#6d28d9' },
    { label: 'Champion', emoji: '🏆', min: 60, color: '#b45309' },
    { label: 'Maître', emoji: '👑', min: 100, color: '#C02A09' },
];

function getRank(boosterCount: number): Rank {
    return [...RANKS].reverse().find(r => boosterCount >= r.min) ?? RANKS[0];
}

function getNextRank(boosterCount: number): { rank: Rank; remaining: number } | null {
    const next = RANKS.find(r => boosterCount < r.min);
    if (!next) return null;
    return { rank: next, remaining: next.min - boosterCount };
}

// ─── Initiales avatar ─────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function Skeleton({ width, height, radius = 12 }: {
    width: number | string; height: number; radius?: number;
}) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, []);
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
    return (
        <Animated.View style={{
            width: width as any, height, borderRadius: radius,
            backgroundColor: '#D4CFBB', opacity,
        }} />
    );
}

// ─── Region Picker Modal ──────────────────────────────────────────────────────

function RegionPicker({
    visible,
    current,
    onSelect,
    onClose,
    themeBg,
    themeBorder,
}: {
    visible: boolean;
    current: string;
    onSelect: (key: string) => void;
    onClose: () => void;
    themeBg: string;
    themeBorder: string;
}) {
    const slideY = useRef(new Animated.Value(400)).current;
    const backdropO = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(backdropO, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideY, { toValue: 400, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
                Animated.timing(backdropO, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={{
                flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropO,
                justifyContent: 'flex-end',
            }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />

                <Animated.View style={{
                    transform: [{ translateY: slideY }],
                    backgroundColor: themeBg,
                    borderTopLeftRadius: 32, borderTopRightRadius: 32,
                    paddingTop: 12, paddingBottom: 40,
                    maxHeight: '80%',
                }}>
                    {/* Handle */}
                    <View style={{
                        width: 36, height: 4, borderRadius: 99,
                        backgroundColor: themeBorder, alignSelf: 'center', marginBottom: 20,
                    }} />

                    <Text style={{
                        fontSize: 16, fontWeight: '900', color: '#0f172a',
                        paddingHorizontal: 20, marginBottom: 16,
                    }}>
                        🗺️  Choisir une région
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ paddingHorizontal: 16, gap: 10 }}>
                            {REGIONS.map(region => {
                                const active = region.key === current;
                                return (
                                    <Pressable
                                        key={region.key}
                                        onPress={() => { onSelect(region.key); onClose(); }}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row', alignItems: 'center',
                                            borderRadius: 20, padding: 14,
                                            backgroundColor: active ? region.primary : themeBg,
                                            borderWidth: 1.5,
                                            borderColor: active ? region.primary : themeBorder,
                                            opacity: pressed ? 0.85 : 1,
                                        })}
                                    >
                                        <View style={{
                                            width: 44, height: 44, borderRadius: 999,
                                            backgroundColor: active ? 'rgba(255,255,255,0.2)' : region.primary + '18',
                                            alignItems: 'center', justifyContent: 'center',
                                            marginRight: 14,
                                        }}>
                                            <Text style={{ fontSize: 22 }}>{region.emoji}</Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 15, fontWeight: '900',
                                                color: active ? '#ffffff' : '#0f172a',
                                            }}>
                                                {region.label}
                                            </Text>
                                            <Text style={{
                                                fontSize: 11, marginTop: 2, fontWeight: '600',
                                                color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                                            }} numberOfLines={1}>
                                                {region.description}
                                            </Text>
                                        </View>

                                        {active && (
                                            <View style={{
                                                width: 22, height: 22, borderRadius: 999,
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Text style={{ fontSize: 12, color: '#ffffff' }}>✓</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
    label, value, accent, delay, primary, surface, border,
}: {
    label: string; value: string | number; accent?: boolean; delay: number;
    primary: string; surface: string; border: string;
}) {
    const scale = useRef(new Animated.Value(0.8)).current;
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
        <Animated.View style={{ transform: [{ scale }], opacity, flex: 1 }}>
            <View style={{
                backgroundColor: accent ? primary : surface,
                borderRadius: 20, paddingVertical: 14, alignItems: 'center',
                borderWidth: 1, borderColor: accent ? primary : border,
                shadowColor: accent ? primary : '#000',
                shadowOpacity: accent ? 0.2 : 0.05,
                shadowRadius: 8, elevation: accent ? 4 : 2,
            }}>
                <Text style={{
                    fontSize: 22, fontWeight: '900',
                    color: accent ? '#ffffff' : '#0f172a',
                }}>{value}</Text>
                <Text style={{
                    marginTop: 3, fontSize: 10, fontWeight: '700', textAlign: 'center',
                    color: accent ? 'rgba(255,255,255,0.75)' : '#64748b',
                }}>{label}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const { token } = useAuth();
    const { width } = useWindowDimensions();
    const theme = useTheme();

    const isPhone = width < 640;
    const sidePad = isPhone ? 16 : 24;
    const maxWidth = Math.min(width, 760);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [savingRegion, setSavingRegion] = useState(false);

    // Animations
    const bannerScale = useRef(new Animated.Value(1.08)).current;
    const bannerOpacity = useRef(new Animated.Value(0)).current;
    const contentY = useRef(new Animated.Value(30)).current;
    const contentO = useRef(new Animated.Value(0)).current;

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [profileRes, statsRes] = await Promise.all([
                apiFetch('/api/me/profile', token),
                apiFetch('/api/stats', token),
            ]);
            if (profileRes.ok) setProfile(await profileRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (e) {
            console.error('Profile load error:', e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(bannerScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(bannerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(contentY, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(contentO, { toValue: 1, duration: 420, useNativeDriver: true }),
            ]).start();
        }
    }, [loading]);

    const handleSelectRegion = async (regionKey: string) => {
        if (!token || !profile) return;
        setSavingRegion(true);
        try {
            const res = await apiFetch('/api/me/region', token, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: regionKey }),
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
            }
        } catch (e) {
            console.error('Region update error:', e);
        } finally {
            setSavingRegion(false);
        }
    };

    const region = getRegion(profile?.region ?? 'Kanto');
    const rank = getRank(stats?.booster_count ?? 0);
    const nextRank = getNextRank(stats?.booster_count ?? 0);
    const completionPct = stats && stats.total_cards > 0
        ? Math.round((stats.unique_owned / stats.total_cards) * 100)
        : 0;
    const initials = profile ? getInitials(profile.name) : '??';

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 52 }}
                showsVerticalScrollIndicator={false}
            >

                {/* ══════════ BANNIÈRE RÉGION ══════════ */}
                <Animated.View style={{
                    height: isPhone ? 220 : 280,
                    transform: [{ scale: bannerScale }],
                    opacity: bannerOpacity,
                    overflow: 'hidden',
                }}>
                    <View style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: region.primary,
                    }} />

                    {/* Pattern de cercles décoratifs */}
                    <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject }}>
                        {[
                            { size: 200, top: -60, right: -40, opacity: 0.12 },
                            { size: 130, top: 40, right: 80, opacity: 0.08 },
                            { size: 160, bottom: -50, left: -30, opacity: 0.10 },
                            { size: 80, top: 20, left: 60, opacity: 0.07 },
                        ].map((c, i) => (
                            <View key={i} style={{
                                position: 'absolute',
                                width: c.size, height: c.size,
                                borderRadius: c.size / 2,
                                backgroundColor: '#ffffff',
                                opacity: c.opacity,
                                top: c.top, bottom: c.bottom,
                                left: c.left, right: c.right,
                            }} />
                        ))}
                    </View>

                    {/* Bande accent en bas */}
                    <View style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 3, backgroundColor: region.accent, opacity: 0.8,
                    }} />

                    {/* Contenu bannière */}
                    <View style={{
                        flex: 1, justifyContent: 'flex-end',
                        paddingHorizontal: sidePad, paddingBottom: 20,
                    }}>
                        <Text style={{
                            fontSize: 11, fontWeight: '900', letterSpacing: 2.5,
                            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
                            marginBottom: 4,
                        }}>
                            {region.emoji}  Région {region.label}
                        </Text>
                        <Text style={{
                            fontSize: 13, fontWeight: '600',
                            color: 'rgba(255,255,255,0.5)', maxWidth: 280,
                        }}>
                            {region.description}
                        </Text>
                    </View>
                </Animated.View>

                {/* ══════════ CONTENU ══════════ */}
                <Animated.View style={{
                    transform: [{ translateY: contentY }],
                    opacity: contentO,
                    alignSelf: 'center',
                    width: '100%',
                    maxWidth: maxWidth,
                    paddingHorizontal: sidePad,
                }}>

                    {/* ── Avatar flottant ── */}
                    <View style={{ alignItems: 'flex-start', marginTop: -36 }}>
                        <View style={{
                            width: 72, height: 72, borderRadius: 999,
                            backgroundColor: region.primary,
                            borderWidth: 4, borderColor: theme.bg,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: region.primary, shadowOpacity: 0.35,
                            shadowRadius: 12, elevation: 8,
                        }}>
                            {loading
                                ? <Skeleton width={72} height={72} radius={999} />
                                : <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffffff' }}>
                                    {initials}
                                </Text>
                            }
                        </View>
                    </View>

                    {/* ── Identité ── */}
                    <View style={{
                        marginTop: 14, borderRadius: 28, borderWidth: 1, borderColor: theme.border,
                        backgroundColor: theme.surface, padding: isPhone ? 18 : 22,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
                    }}>
                        {loading ? (
                            <View style={{ gap: 10 }}>
                                <Skeleton width={180} height={24} radius={8} />
                                <Skeleton width={220} height={16} radius={6} />
                            </View>
                        ) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                    <View>
                                        <Text style={{ fontSize: isPhone ? 22 : 26, fontWeight: '900', color: '#0f172a' }}>
                                            {profile?.name}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 3 }}>
                                            {profile?.email}
                                        </Text>
                                    </View>

                                    {/* Badge rang — couleurs sémantiques fixes */}
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 6,
                                        backgroundColor: rank.color + '15',
                                        borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
                                        borderWidth: 1, borderColor: rank.color + '40',
                                    }}>
                                        <Text style={{ fontSize: 16 }}>{rank.emoji}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '900', color: rank.color }}>
                                            {rank.label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progression vers prochain rang */}
                                {nextRank && (
                                    <View style={{ marginTop: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
                                                Prochain rang — {nextRank.rank.emoji} {nextRank.rank.label}
                                            </Text>
                                            <Text style={{ fontSize: 12, fontWeight: '900', color: rank.color }}>
                                                {nextRank.remaining} boosters
                                            </Text>
                                        </View>
                                        <View style={{ height: 6, borderRadius: 99, backgroundColor: theme.border, overflow: 'hidden' }}>
                                            <View style={{
                                                height: '100%', borderRadius: 99,
                                                backgroundColor: rank.color,
                                                width: `${Math.min(100, 100 - (nextRank.remaining / nextRank.rank.min) * 100)}%`,
                                            }} />
                                        </View>
                                    </View>
                                )}

                                {/* Bouton changer région */}
                                <Pressable
                                    onPress={() => setPickerVisible(true)}
                                    disabled={savingRegion}
                                    style={({ pressed }) => ({
                                        marginTop: 16, flexDirection: 'row', alignItems: 'center',
                                        justifyContent: 'center', gap: 8,
                                        borderRadius: 999, paddingVertical: 12,
                                        backgroundColor: region.primary,
                                        opacity: pressed || savingRegion ? 0.75 : 1,
                                        shadowColor: region.primary, shadowOpacity: 0.2,
                                        shadowRadius: 10, elevation: 3,
                                    })}
                                >
                                    <Text style={{ fontSize: 16 }}>{region.emoji}</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff', letterSpacing: 0.5 }}>
                                        {savingRegion ? 'Enregistrement…' : `Région ${region.label} — Changer`}
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>

                    {/* ── Stats ── */}
                    <View style={{ marginTop: 14 }}>
                        <Text style={{
                            fontSize: 12, fontWeight: '900', color: '#94a3b8',
                            letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase',
                        }}>
                            Statistiques
                        </Text>

                        {loading ? (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {[0, 1, 2].map(i => <Skeleton key={i} width={(maxWidth - sidePad * 2 - 20) / 3} height={84} radius={20} />)}
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <StatPill label="Boosters" value={stats?.booster_count ?? 0} accent delay={0} primary={theme.primary} surface={theme.surface} border={theme.border} />
                                <StatPill label="Cartes" value={stats?.total_owned ?? 0} delay={80} primary={theme.primary} surface={theme.surface} border={theme.border} />
                                <StatPill label="Rares" value={stats?.rare_count ?? 0} delay={160} primary={theme.primary} surface={theme.surface} border={theme.border} />
                            </View>
                        )}
                    </View>

                    {/* ── Progression Pokédex ── */}
                    <View style={{
                        marginTop: 14, borderRadius: 28, borderWidth: 1, borderColor: theme.border,
                        backgroundColor: theme.surface, padding: isPhone ? 18 : 22,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{
                                    width: 38, height: 38, borderRadius: 999,
                                    backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 18 }}>📖</Text>
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a' }}>
                                    Pokédex
                                </Text>
                            </View>
                            {!loading && (
                                <Text style={{ fontSize: 22, fontWeight: '900', color: theme.primary }}>
                                    {completionPct}%
                                </Text>
                            )}
                        </View>

                        {loading ? (
                            <Skeleton width="100%" height={8} radius={99} />
                        ) : (
                            <>
                                <View style={{ height: 8, borderRadius: 99, backgroundColor: theme.border, overflow: 'hidden' }}>
                                    <View style={{
                                        height: '100%', borderRadius: 99,
                                        backgroundColor: completionPct >= 80 ? theme.accent : theme.primary,
                                        width: `${completionPct}%`,
                                    }} />
                                </View>
                                <Text style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>
                                    {stats?.unique_owned ?? 0} cartes uniques sur {stats?.total_cards ?? 0}
                                </Text>
                            </>
                        )}
                    </View>

                </Animated.View>
            </ScrollView>

            {/* ── Region Picker ── */}
            <RegionPicker
                visible={pickerVisible}
                current={profile?.region ?? 'Kanto'}
                onSelect={handleSelectRegion}
                onClose={() => setPickerVisible(false)}
                themeBg={theme.bg}
                themeBorder={theme.border}
            />
        </View>
    );
}
