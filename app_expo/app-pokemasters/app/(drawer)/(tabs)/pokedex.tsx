import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { apiFetch } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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

const PAGE_SIZE = 10;

// ─── Rarity styles ────────────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, {
  bg: string; border: string; dot: string; label: string; text: string;
}> = {
  Common: { bg: '#F1F5F9', border: '#E2E8F0', dot: '#94a3b8', label: 'Commun', text: '#64748b' },
  Uncommon: { bg: '#ECFDF5', border: '#A7F3D0', dot: '#34d399', label: 'Peu commun', text: '#059669' },
  Rare: { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3b82f6', label: 'Rare', text: '#2563eb' },
  'Ultra Rare': { bg: '#FFFBEB', border: '#FDE68A', dot: '#f59e0b', label: 'Ultra Rare', text: '#d97706' },
  Secret: { bg: '#F5F3FF', border: '#DDD6FE', dot: '#7c3aed', label: 'Secret', text: '#6d28d9' },
};

const getRarityStyle = (rarity: string | null) =>
  RARITY_STYLES[rarity ?? 'Common'] ?? RARITY_STYLES.Common;

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: 'all', label: 'Tous', emoji: '📋' },
  { key: 'Rare', label: 'Rare', emoji: '💎' },
  { key: 'Ultra Rare', label: 'Ultra Rare', emoji: '✨' },
  { key: 'Secret', label: 'Secret', emoji: '🌟' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Pokedex() {
  const { token } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const isPhone = width < 640;
  const numCols = isPhone ? 2 : width < 1024 ? 3 : 4;
  const sidePad = isPhone ? 16 : 24;

  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('pokedex');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const listRef = useRef<FlatList>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPokedex = useCallback(async (
    pageToLoad: number,
    currentMode: Mode,
    rarity: FilterKey,
  ) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = currentMode === 'collection'
        ? '/api/user/collection/pagination'
        : '/api/user/pagination';
      const rarityParam = rarity !== 'all' ? `&rarity=${encodeURIComponent(rarity)}` : '';
      const response = await apiFetch(
        `${endpoint}?page=${pageToLoad}&limit=${PAGE_SIZE}${rarityParam}`,
        token,
      );

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

      const data: PaginatedResponse = await response.json();

      // ✅ FIX pagination : on remplace (pas accumule) — c'est une pagination par page,
      //    on scrollToTop après chaque changement de page
      setPokemons(data.items);
      setTotalCount(data.count);
    } catch (err: any) {
      setError('Impossible de charger le Pokédex. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPokedex(page, mode, activeFilter);
  }, [page, mode, activeFilter, fetchPokedex]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const goToPage = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setPokemons([]);
    setPage(newPage);
    setQuery('');
    // ✅ FIX : scroll haut après changement de page
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);
  }, [totalPages, loading]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setPage(1);
    setActiveFilter('all');
    setQuery('');
  }, []);

  const handleFilterChange = useCallback((key: FilterKey) => {
    setActiveFilter(key);
    setPage(1);
    setQuery('');
  }, []);

  // ── Recherche locale ───────────────────────────────────────────────────────
  const visiblePokemons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pokemons;
    return pokemons.filter(p =>
      `${p.id} ${p.name} ${p.category ?? ''} ${p.rarity ?? ''}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [pokemons, query]);

  const rarityCount = useMemo(
    () => pokemons.filter(p =>
      p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret'
    ).length,
    [pokemons]
  );

  const totalOwned = useMemo(
    () => pokemons.reduce((acc, p) => acc + p.quantity, 0),
    [pokemons]
  );

  // ── Render item ────────────────────────────────────────────────────────────
  const renderPokemon = useCallback(({ item }: { item: Pokemon }) => {
    const style = getRarityStyle(item.rarity);

    return (
      <Pressable
        style={({ pressed }) => ({
          flex: 1, borderRadius: 24, borderWidth: 2,
          borderColor: style.border, backgroundColor: '#ffffff',
          padding: 12, opacity: pressed ? 0.82 : 1,
          shadowColor: '#000', shadowOpacity: 0.06,
          shadowRadius: 8, elevation: 2,
        })}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>
            #{String(item.id).padStart(3, '0')}
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: style.bg, borderRadius: 99,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: style.dot }} />
            <Text style={{ fontSize: 9, fontWeight: '800', color: style.text }}>
              {item.rarity ?? 'Common'}
            </Text>
          </View>
        </View>

        {/* Image */}
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 96, height: 96, borderRadius: 18,
            backgroundColor: '#F5F0DC',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Image
              source={{ uri: item.image + '/high.png' }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Nom */}
        <Text style={{
          marginTop: 10, fontSize: 13, fontWeight: '900', color: '#0f172a',
        }} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Catégorie */}
        <Text style={{ marginTop: 2, fontSize: 11, color: '#94a3b8' }} numberOfLines={1}>
          {item.category ?? 'Pokémon'}
        </Text>

        {/* Quantité — couleur région */}
        <View style={{
          marginTop: 10, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', borderRadius: 12,
          backgroundColor: theme.primary + '12',
          paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>Quantité</Text>
          <Text style={{ fontSize: 13, fontWeight: '900', color: theme.primary }}>
            ×{item.quantity}
          </Text>
        </View>
      </Pressable>
    );
    // ✅ FIX : theme.primary dans les deps pour que la couleur se mette à jour
  }, [theme.primary, page]);

  // ── Header ────────────────────────────────────────────────────────────────
  // ✅ FIX : tous les états et handlers dans les deps
  const headerElement = useMemo(() => (
    <View style={{ marginBottom: 16 }}>

      {/* Hero card */}
      <View style={{ ...theme.card, padding: isPhone ? 18 : 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            {/* ✅ textAccent région */}
            <Text style={{
              fontSize: 11, fontWeight: '900', letterSpacing: 2,
              color: theme.textAccent, textTransform: 'uppercase',
            }}>
              Pokédex
            </Text>
            <Text style={{ marginTop: 4, fontSize: isPhone ? 22 : 26, fontWeight: '900', color: '#0f172a' }}>
              {mode === 'pokedex' ? 'Tous les Pokémon' : 'Ma collection'}
            </Text>
          </View>

          {/* Avatar icone — couleur région */}
          <View style={{
            width: 56, height: 56, borderRadius: 999,
            backgroundColor: theme.primary,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: theme.primary, shadowOpacity: 0.2,
            shadowRadius: 10, elevation: 4,
          }}>
            <Text style={{ fontSize: 26 }}>
              {mode === 'pokedex' ? '📖' : '⭐'}
            </Text>
          </View>
        </View>

        {/* Stats — bg région */}
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Total', value: totalCount },
            { label: 'Rares +', value: rarityCount },
            { label: 'Possédées', value: totalOwned },
          ].map(({ label, value }) => (
            <View key={label} style={{
              flex: 1, alignItems: 'center', borderRadius: 18,
              backgroundColor: theme.primary + '10',
              paddingVertical: 12,
              borderWidth: 1, borderColor: theme.border,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{value}</Text>
              <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '600', color: '#64748b' }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={{
          marginTop: 14, flexDirection: 'row', alignItems: 'center',
          borderRadius: 18, borderWidth: 1, borderColor: theme.border,
          backgroundColor: '#FAFAF7', paddingHorizontal: 14, paddingVertical: 12,
        }}>
          <Text style={{ marginRight: 8, color: '#94a3b8' }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un Pokémon..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: '#0f172a' }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Toggle Pokédex / Ma collection — couleur région */}
      <View style={{
        marginTop: 12, flexDirection: 'row', alignItems: 'center',
        borderRadius: 20, borderWidth: 1, borderColor: theme.border,
        backgroundColor: '#ffffff', padding: 5,
      }}>
        {(['pokedex', 'collection'] as Mode[]).map(m => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => handleModeChange(m)}
              style={{
                flex: 1, alignItems: 'center', borderRadius: 15,
                paddingVertical: 11,
                backgroundColor: active ? theme.primary : 'transparent',
                shadowColor: active ? theme.primary : 'transparent',
                shadowOpacity: active ? 0.2 : 0,
                shadowRadius: 8, elevation: active ? 3 : 0,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '800',
                color: active ? '#ffffff' : '#64748b',
              }}>
                {m === 'pokedex' ? '📖 Pokédex' : '⭐ Ma collection'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Filtres rareté — couleur région */}
      <View style={{ marginTop: 12 }}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = activeFilter === item.key;
            return (
              <Pressable
                onPress={() => handleFilterChange(item.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: active ? theme.primary : '#ffffff',
                  borderWidth: 1,
                  borderColor: active ? theme.primary : theme.border,
                  elevation: active ? 3 : 1,
                }}
              >
                <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                <Text style={{
                  fontSize: 13, fontWeight: '700',
                  color: active ? '#ffffff' : '#0f172a',
                }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  ), [query, mode, activeFilter, totalCount, rarityCount, totalOwned,
    theme.primary, theme.textAccent, theme.card, theme.border, isPhone,
    handleModeChange, handleFilterChange]);

  // ── Empty / Error ──────────────────────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return (
      <View style={{ marginTop: 64, alignItems: 'center' }}>
        {/* ✅ spinner couleur région */}
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 12, fontSize: 13, fontWeight: '600', color: '#64748b' }}>
          Chargement…
        </Text>
      </View>
    );

    if (error) return (
      <View style={{
        marginTop: 64, alignItems: 'center', borderRadius: 24,
        borderWidth: 1, borderColor: '#FECACA',
        backgroundColor: '#FEF2F2', padding: 24,
      }}>
        <Text style={{ fontSize: 28 }}>⚠️</Text>
        <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '800', color: '#B91C1C' }}>
          Erreur de chargement
        </Text>
        <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 13, color: '#EF4444' }}>
          {error}
        </Text>
        <Pressable
          onPress={() => fetchPokedex(page, mode, activeFilter)}
          style={{
            marginTop: 16, borderRadius: 18,
            backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12,
          }}
        >
          <Text style={{ fontWeight: '800', color: '#ffffff' }}>Réessayer</Text>
        </Pressable>
      </View>
    );

    return (
      <View style={{
        marginTop: 64, alignItems: 'center', borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.7)', padding: 24,
      }}>
        <Text style={{ fontSize: 32 }}>😴</Text>
        <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
          Aucun Pokémon trouvé
        </Text>
        <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          Essaie un autre filtre ou une autre recherche.
        </Text>
      </View>
    );
  };

  // ── Footer / Pagination ────────────────────────────────────────────────────
  const renderFooter = () => (
    <View style={{ marginTop: 20 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 24, borderWidth: 1, borderColor: theme.border,
        backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 14, paddingVertical: 10,
      }}>

        {/* ✅ Bouton précédent — couleur accent région */}
        <Pressable
          onPress={() => goToPage(page - 1)}
          disabled={page === 1 || loading}
          style={{
            borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12,
            backgroundColor: page === 1 || loading ? '#F1F5F9' : theme.accent,
          }}
        >
          <Text style={{
            fontWeight: '800',
            color: page === 1 || loading ? '#94a3b8' : '#0f172a',
          }}>
            ← Préc.
          </Text>
        </Pressable>

        {/* Infos page */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>
            {page} / {totalPages}
          </Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
            {totalCount} cartes
          </Text>
        </View>

        {/* ✅ Bouton suivant — couleur accent région */}
        <Pressable
          onPress={() => goToPage(page + 1)}
          disabled={page === totalPages || loading}
          style={{
            borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12,
            backgroundColor: page === totalPages || loading ? '#F1F5F9' : theme.accent,
          }}
        >
          <Text style={{
            fontWeight: '800',
            color: page === totalPages || loading ? '#94a3b8' : '#0f172a',
          }}>
            Suiv. →
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={listRef}
        data={visiblePokemons}
        keyExtractor={item => `page${page}-${item.id}`}
        extraData={pokemons}
        numColumns={numCols}
        key={`grid-${numCols}-${page}`} 
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          paddingTop: 24,
          paddingBottom: 40,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        renderItem={renderPokemon}
        removeClippedSubviews={false}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        style={{ opacity: loading ? 0.65 : 1 }}
      />

    </View>
  );
}
