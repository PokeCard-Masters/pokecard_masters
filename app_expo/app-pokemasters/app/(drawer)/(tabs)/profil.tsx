import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StatusBar,
  ActivityIndicator, Pressable,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | null;

type Trophy = {
  key: string;
  label: string;
  emoji: string;
  count: number;
  tier: Tier;
  next_tier: string | null;
  next_threshold: number | null;
  progress: number;
};

type Profil = {
  name: string;
  email: string;
  boosters_opened: number;
  cards_owned: number;
  unique_cards: number;
  type_trophies: Trophy[];
  category_trophies: Trophy[];
};

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; ring: string }> = {
  bronze:   { label: 'Bronze',  color: '#a16207', bg: 'bg-amber-50',   border: 'border-amber-200',  ring: '#d97706' },
  silver:   { label: 'Argent',  color: '#475569', bg: 'bg-slate-100',  border: 'border-slate-300',  ring: '#94a3b8' },
  gold:     { label: 'Or',      color: '#b45309', bg: 'bg-yellow-50',  border: 'border-yellow-300', ring: '#FFCB05' },
  platinum: { label: 'Platine', color: '#C02A09', bg: 'bg-red-50',     border: 'border-red-200',    ring: '#C02A09' },
};

const TIER_MEDAL: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '🏆',
};

export default function Profil() {
  const { token } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'types' | 'categories'>('types');

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/profil', token);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfil(data);
    } catch {
      setError('Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View className="flex-1 bg-[#F5F0DC] items-center justify-center">
      <ActivityIndicator size="large" color="#C02A09" />
    </View>
  );

  if (error || !profil) return (
    <View className="flex-1 bg-[#F5F0DC] items-center justify-center px-8">
      <Text className="text-2xl mb-3">⚠️</Text>
      <Text className="text-base font-bold text-slate-700 mb-1">Erreur de chargement</Text>
      <Pressable onPress={fetchProfil} className="mt-4 bg-[#C02A09] rounded-2xl px-6 py-3">
        <Text className="text-white font-bold">Réessayer</Text>
      </Pressable>
    </View>
  );

  const trophies = tab === 'types' ? profil.type_trophies : profil.category_trophies;
  const unlockedCount = trophies.filter(t => t.tier !== null).length;
  const platinumCount = trophies.filter(t => t.tier === 'platinum').length;

  return (
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 60 }}>

        {/* ── Hero profil ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5 mb-4" style={{ elevation: 2 }}>
          <View className="flex-row items-center gap-4">
            {/* Avatar */}
            <View className="h-16 w-16 rounded-full bg-[#FFCB05] items-center justify-center" style={{ elevation: 3 }}>
              <Text className="text-3xl">
                {profil.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
                Dresseur
              </Text>
              <Text className="text-xl font-black text-slate-900" numberOfLines={1}>
                {profil.name}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                {profil.email}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View className="mt-4 flex-row gap-2">
            {[
              { label: 'Boosters', value: profil.boosters_opened, emoji: '🎴' },
              { label: 'Cartes',   value: profil.cards_owned,     emoji: '📦' },
              { label: 'Uniques',  value: profil.unique_cards,    emoji: '✨' },
            ].map(({ label, value, emoji }) => (
              <View key={label} className="flex-1 items-center rounded-2xl bg-[#F5F0DC] py-3 px-1">
                <Text className="text-base">{emoji}</Text>
                <Text className="text-sm font-black text-slate-900 mt-1">{value.toLocaleString()}</Text>
                <Text className="text-[9px] font-semibold text-slate-400 mt-0.5 text-center">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Résumé trophées ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5 mb-4 flex-row items-center justify-between" style={{ elevation: 2 }}>
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
              Trophées
            </Text>
            <Text className="text-2xl font-black text-slate-900 mt-0.5">
              {unlockedCount} débloqués
            </Text>
            {platinumCount > 0 && (
              <Text className="text-xs text-slate-400 mt-0.5">
                dont {platinumCount} 🏆 Platine
              </Text>
            )}
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
            <Text className="text-2xl">🏆</Text>
          </View>
        </View>

        {/* ── Onglets ── */}
        <View className="flex-row rounded-2xl border border-[#E8E3C8] bg-white p-1.5 mb-4" style={{ elevation: 1 }}>
          {(['types', 'categories'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 items-center rounded-xl py-2.5 ${tab === t ? 'bg-[#C02A09]' : ''}`}
              style={{ elevation: tab === t ? 2 : 0 }}
            >
              <Text className={`text-sm font-bold ${tab === t ? 'text-white' : 'text-slate-500'}`}>
                {t === 'types' ? '⚡ Types' : '📦 Catégories'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Grille de trophées ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {trophies.map((trophy) => (
            <TrophyCard key={trophy.key} trophy={trophy} />
          ))}
          {trophies.length === 0 && (
            <View className="flex-1 items-center py-12 rounded-3xl bg-white border border-[#E8E3C8]">
              <Text className="text-3xl mb-2">😴</Text>
              <Text className="text-sm font-bold text-slate-500">Aucun trophée pour l'instant</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

// ─── TrophyCard ───────────────────────────────────────────────────────────────

function TrophyCard({ trophy }: { trophy: Trophy }) {
  const isLocked = trophy.tier === null;
  const cfg = trophy.tier ? TIER_CONFIG[trophy.tier] : null;
  const nextCfg = trophy.next_tier ? TIER_CONFIG[trophy.next_tier] : null;
  const barColor = nextCfg?.ring ?? '#E8E3C8';
  const progressPercent = Math.round(trophy.progress * 100);

  return (
    <View
      style={{
        width: '47%',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: isLocked ? '#E8E3C8' : cfg!.ring,
        backgroundColor: isLocked ? '#ffffff' : cfg!.ring + '15',
        padding: 16,
      }}
    >
      {/* Emoji + médaille */}
      <View className="flex-row items-start justify-between mb-2">
        <Text style={{ fontSize: 32, opacity: isLocked ? 0.25 : 1 }}>
          {trophy.emoji}
        </Text>
        {trophy.tier && (
          <Text style={{ fontSize: 18 }}>{TIER_MEDAL[trophy.tier]}</Text>
        )}
      </View>

      {/* Nom */}
      <Text
        style={{ fontSize: 13, fontWeight: '800', color: isLocked ? '#cbd5e1' : '#0f172a', marginBottom: 2 }}
        numberOfLines={1}
      >
        {trophy.label}
      </Text>

      {/* Palier actuel */}
      {trophy.tier ? (
        <Text style={{ fontSize: 10, fontWeight: '700', color: cfg!.ring, marginBottom: 8 }}>
          {TIER_CONFIG[trophy.tier].label.toUpperCase()}
        </Text>
      ) : (
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#cbd5e1', marginBottom: 8 }}>
          NON DÉBLOQUÉ
        </Text>
      )}

      {/* Barre de progression */}
      <View style={{ height: 6, backgroundColor: '#E8E3C8', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
        <View style={{
          height: '100%',
          width: `${progressPercent}%`,
          backgroundColor: isLocked ? '#E8E3C8' : barColor,
          borderRadius: 999,
        }} />
      </View>

      {/* Label progression */}
      <View className="flex-row justify-between items-center">
        <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>
          {trophy.count} cartes
        </Text>
        {trophy.next_threshold !== null ? (
          <Text style={{ fontSize: 10, fontWeight: '700', color: isLocked ? '#cbd5e1' : barColor }}>
            {trophy.next_threshold} →
          </Text>
        ) : (
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#C02A09' }}>MAX ✓</Text>
        )}
      </View>
    </View>
  );
}