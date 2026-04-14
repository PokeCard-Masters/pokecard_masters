import { ActivityIndicator, FlatList, Image, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/auth';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Pokemon = {
  id: number;
  name: string;
  image: string;
  category: string | null;
  rarity: string | null;
  illustrator: string | null;
  quantity: number;
};

type PaginatedResponse = {
  items: Pokemon[];
  count: number;
};

type Mode = 'pokedex' | 'collection';
type FilterKey = 'all' | 'Rare' | 'Ultra Rare' | 'Secret';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const PAGE_SIZE = 10;

const RARITY_STYLES: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  Common:       { bg: 'bg-slate-100',   border: 'border-slate-200',   dot: 'bg-slate-400',   label: 'Commun'     },
  Uncommon:     { bg: 'bg-emerald-100', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Peu commun' },
  Rare:         { bg: 'bg-blue-100',    border: 'border-blue-200',    dot: 'bg-blue-500',    label: 'Rare'       },
  'Ultra Rare': { bg: 'bg-amber-100',   border: 'border-amber-200',   dot: 'bg-amber-400',   label: 'Ultra Rare' },
  Secret:       { bg: 'bg-violet-100',  border: 'border-violet-200',  dot: 'bg-violet-500',  label: 'Secret'     },
};

const getRarityStyle = (rarity: string | null) =>
  RARITY_STYLES[rarity ?? 'Common'] ?? RARITY_STYLES.Common;

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: 'all',        label: 'Tous',       emoji: '📋' },
  { key: 'Rare',       label: 'Rare',       emoji: '💎' },
  { key: 'Ultra Rare', label: 'Ultra Rare', emoji: '✨' },
  { key: 'Secret',     label: 'Secret',     emoji: '🌟' },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function Pokedex() {
  const { token } = useAuth();

  const [pokemons, setPokemons]         = useState<Pokemon[]>([]);
  const [page, setPage]                 = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [mode, setMode]                 = useState<Mode>('pokedex');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [query, setQuery]               = useState('');

  const listRef    = useRef<FlatList>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));


  const fetchPokedex = async (pageToLoad: number, currentMode: Mode, rarity: FilterKey) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = currentMode === 'collection'
        ? '/api/user/collection/pagination' 
        : '/api/user/pagination';

      const rarityParam = rarity !== 'all' ? `&rarity=${encodeURIComponent(rarity)}` : '';
      const url = `${API_BASE_URL}${endpoint}?page=${pageToLoad}&limit=${PAGE_SIZE}${rarityParam}`;

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

      const data: PaginatedResponse = await response.json();
      setPokemons(data.items);
      setTotalCount(data.count);
    } catch (err: any) {
      console.error('Type:', err?.name);
      console.error('Message:', err?.message);
      setError('Impossible de charger le Pokédex. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch à chaque changement de page, mode ou filtre
  useEffect(() => {
    fetchPokedex(page, mode, activeFilter);
  }, [page, mode, activeFilter]);

  // ── Recherche locale sur la page courante ────────────────────────────────
  const visiblePokemons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pokemons;
    return pokemons.filter((p) =>
      `${p.id} ${p.name} ${p.category ?? ''} ${p.rarity ?? ''}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [pokemons, query]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const rarityCount = useMemo(
    () => pokemons.filter((p) =>
      p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret'
    ).length,
    [pokemons]
  );

  const totalOwned = useMemo(
    () => pokemons.reduce((acc, p) => acc + p.quantity, 0),
    [pokemons]
  );

  // ── Navigation ───────────────────────────────────────────────────────────
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setPage(newPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setPage(1);
    setActiveFilter('all');
    setQuery('');
  };

  const handleFilterChange = (key: FilterKey) => {
    setActiveFilter(key);
    setPage(1);
    setQuery('');
  };

  // ─────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────
  const renderPokemon = ({ item }: { item: Pokemon }) => {
    const style = getRarityStyle(item.rarity);

    return (
      <Pressable
        className={`flex-1 rounded-3xl border-2 ${style.border} bg-white p-3 shadow-sm active:opacity-80`}
        style={{ elevation: 2 }}
      >
        {/* Header */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-400">
            #{String(item.id).padStart(3, '0')}
          </Text>
          <View className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${style.bg}`}>
            <View className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            <Text className="text-[10px] font-bold text-slate-700">
              {item.rarity ?? 'Common'}
            </Text>
          </View>
        </View>

        {/* Image */}
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-[#F5F0DC]">
            <Image
              source={{ uri: `${API_BASE_URL}${item.image}` }}

              className="h-20 w-20"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Nom */}
        <Text className="mt-3 text-sm font-extrabold text-slate-900" numberOfLines={1}>
          {item.name}
        </Text>

        {/* Catégorie */}
        <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
          {item.category ?? 'Pokémon'}
        </Text>

        {/* Quantité */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl bg-[#FFF8E6] px-2 py-1">
          <Text className="text-[11px] font-semibold text-slate-500">Quantité</Text>
          <Text className="text-sm font-black text-[#C02A09]">×{item.quantity}</Text>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">

      {/* ── Hero card ── */}
      <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
              Pokédex
            </Text>
            <Text className="mt-0.5 text-2xl font-black text-slate-900">
              {mode === 'pokedex' ? 'Tous les Pokémon' : 'Ma collection'}
            </Text>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
            <Text className="text-2xl">⚡</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="mt-4 flex-row gap-3">
          {[
            { label: 'Total',     value: totalCount  },
            { label: 'Rares +',   value: rarityCount },
            { label: 'Possédées', value: totalOwned  },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 items-center rounded-2xl bg-[#F5F0DC] py-3">
              <Text className="text-lg font-black text-slate-900">{value}</Text>
              <Text className="mt-0.5 text-[10px] font-semibold text-slate-500">{label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View className="mt-4 flex-row items-center rounded-2xl border border-[#E8E3C8] bg-[#FAFAF7] px-4 py-3">
          <Text className="mr-2 text-slate-400">🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un Pokémon..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-sm text-slate-900"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Text className="text-slate-400">✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Toggle Pokédex / Ma collection ── */}
      <View className="mt-4 flex-row items-center rounded-2xl border border-[#E8E3C8] bg-white p-1.5">
        {(['pokedex', 'collection'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => handleModeChange(m)}
            className={`flex-1 items-center rounded-xl py-2.5 ${
              mode === m ? 'bg-[#C02A09]' : ''
            }`}
            style={{ elevation: mode === m ? 2 : 0 }}
          >
            <Text className={`text-sm font-bold ${mode === m ? 'text-white' : 'text-slate-600'}`}>
              {m === 'pokedex' ? '📖 Pokédex' : '⭐ Ma collection'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Filtres rareté ── */}
      <View className="mt-4">
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = activeFilter === item.key;
            return (
              <Pressable
                onPress={() => handleFilterChange(item.key)}
                className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${
                  active ? 'bg-[#C02A09]' : 'border border-[#E8E3C8] bg-white'
                }`}
                style={{ elevation: active ? 3 : 1 }}
              >
                <Text className="text-sm">{item.emoji}</Text>
                <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-700'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return (
      <View className="mt-16 items-center">
        <ActivityIndicator size="large" color="#C02A09" />
        <Text className="mt-4 text-sm font-semibold text-slate-600">Chargement…</Text>
      </View>
    );

    if (error) return (
      <View className="mt-16 items-center rounded-3xl border border-red-100 bg-red-50 p-6">
        <Text className="text-2xl">⚠️</Text>
        <Text className="mt-2 text-base font-bold text-red-700">Erreur de chargement</Text>
        <Text className="mt-1 text-center text-sm text-red-500">{error}</Text>
        <Pressable
          onPress={() => fetchPokedex(page, mode, activeFilter)}
          className="mt-4 rounded-2xl bg-[#C02A09] px-6 py-3"
        >
          <Text className="font-bold text-white">Réessayer</Text>
        </Pressable>
      </View>
    );

    return (
      <View className="mt-16 items-center rounded-3xl bg-white/70 p-6">
        <Text className="text-3xl">😴</Text>
        <Text className="mt-2 text-base font-bold text-slate-900">Aucun Pokémon trouvé</Text>
        <Text className="mt-1 text-center text-sm text-slate-500">
          Essaie un autre filtre ou une autre recherche.
        </Text>
      </View>
    );
  };

  const renderFooter = () => (
    <View className="mt-6">
      <View className="flex-row items-center justify-between rounded-3xl border border-[#E8E3C8] bg-white/80 px-4 py-3">
        <Pressable
          onPress={() => goToPage(page - 1)}
          disabled={page === 1 || loading}
          className={`rounded-2xl px-5 py-3 ${page === 1 || loading ? 'bg-slate-100' : 'bg-[#FFCB05]'}`}
        >
          <Text className={`font-bold ${page === 1 || loading ? 'text-slate-400' : 'text-slate-900'}`}>
            ← Préc.
          </Text>
        </Pressable>

        <View className="items-center">
          <Text className="text-sm font-black text-slate-700">{page} / {totalPages}</Text>
          <Text className="text-[10px] text-slate-400">{totalCount} cartes</Text>
        </View>

        <Pressable
          onPress={() => goToPage(page + 1)}
          disabled={page === totalPages || loading}
          className={`rounded-2xl px-5 py-3 ${page === totalPages || loading ? 'bg-slate-100' : 'bg-[#FFCB05]'}`}
        >
          <Text className={`font-bold ${page === totalPages || loading ? 'text-slate-400' : 'text-slate-900'}`}>
            Suiv. →
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />

      <FlatList
        ref={listRef}
        data={visiblePokemons}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        renderItem={renderPokemon}
        style={{ opacity: loading ? 0.6 : 1 }}
      />
    </View>
  );
}