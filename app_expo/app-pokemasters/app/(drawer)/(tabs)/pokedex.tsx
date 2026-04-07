import { StyleSheet, View, Text, FlatList, Image, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/auth';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';
import DropDown from '@/components/DropDown';

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

type RarityKey = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Secret';

const RARITY_STYLES: Record<RarityKey, { color: string; bg: string; border: string }> = {
  'Common':     { color: '#90a4ae', bg: '#90a4ae11', border: '#90a4ae44' },
  'Uncommon':   { color: '#66bb6a', bg: '#66bb6a11', border: '#66bb6a44' },
  'Rare':       { color: '#4fc3f7', bg: '#4fc3f711', border: '#4fc3f744' },
  'Ultra Rare': { color: '#f0c040', bg: '#f0c04011', border: '#f0c04044' },
  'Secret':     { color: '#9c6bff', bg: '#9c6bff11', border: '#9c6bff44' },
};

const PAGE_SIZE = 10;

export default function Pokedex() {
  const { token } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>('pokedex');
  const filterRef = useRef(filter);
  const listRef = useRef<FlatList>(null);
  const [userStats, setUserStats] = useState({ total: 0, rares: 0, illustrateurs: 0 });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchPokedex = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/pagination?page=${pageToLoad}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

      const data: PaginatedResponse = await response.json();
      if (filterRef.current !== 'pokedex') return;
      setPokemons(data.items);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Erreur fetch pagination :', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyCards = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/player/card', token);
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

      const data: Pokemon[] = await response.json();
      if (filterRef.current !== 'mes_cartes') return;
      setPokemons(data);
      setTotalCount(data.length);
      setUserStats({
        total: data.length,
        rares: data.filter(p => p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret').length,
        illustrateurs: new Set(data.map(p => p.illustrator).filter(Boolean)).size,
      });
    } catch (error) {
      console.error('Erreur fetch mes cartes :', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleFilterChange = useCallback((value: string | null) => {
    setFilter(value);
    filterRef.current = value;
    setPokemons([]);
    setPage(1);
    setTotalCount(0);

    if (value === 'mes_cartes') {
      fetchMyCards();
    }
  }, [fetchMyCards]);

  // Fetch user card stats once on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const response = await apiFetch('/api/player/card', token);
        if (!response.ok) return;
        const data: Pokemon[] = await response.json();
        setUserStats({
          total: data.length,
          rares: data.filter(p => p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret').length,
          illustrateurs: new Set(data.map(p => p.illustrator).filter(Boolean)).size,
        });
      } catch {}
    })();
  }, [token]);

  useEffect(() => {
    if (filter === 'pokedex') {
      fetchPokedex(page);
    }
  }, [filter, page]);

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setPage(newPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const getRarityStyle = (rarity: string | null) =>
    RARITY_STYLES[(rarity as RarityKey)] ?? RARITY_STYLES['Common'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={{ zIndex: 1000, elevation: 1000 }}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.pokeball}>
              <View style={styles.pokeballCenter} />
            </View>
            <Text style={styles.title}>Ma Collection</Text>
          </View>
          <Text style={styles.subtitle}>POKÉMON TCG · VAULT DU DRESSEUR</Text>
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{userStats.total}</Text>
              <Text style={styles.statLabel}>CARTES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{userStats.rares}</Text>
              <Text style={styles.statLabel}>RARES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{userStats.illustrateurs}</Text>
              <Text style={styles.statLabel}>ILLUS.</Text>
            </View>
          </View>
        </View>
        <DropDown onSelect={handleFilterChange} defaultValue="pokedex" />
      </View>

      <View style={styles.divider} />
      <View style={{ flex: 1, zIndex: 1, elevation: 1 }}>
        {loading ? (
          <ActivityIndicator color="#f0c040" style={{ marginVertical: 32 }} />
        ) : (
        <FlatList
          ref={listRef}
          data={pokemons}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          ListFooterComponent={filter === 'pokedex' && totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>Préc.</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                onPress={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>Suiv.</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          renderItem={({ item }) => {
            const rs = getRarityStyle(item.rarity);
            return (
              <View style={styles.card}>
                <View style={[styles.cardInner, { borderColor: rs.border }]}>
                  <View style={styles.imgWrap}>
                    <Image
                      source={{ uri: item.image + '/high.png' }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>×{item.quantity}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  {item.rarity && (
                    <View style={[styles.rarityBadge, { backgroundColor: rs.bg, borderColor: rs.border }]}>
                      <Text style={[styles.rarityText, { color: rs.color }]}>
                        {item.rarity.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {item.illustrator && (
                    <Text style={styles.illustrator} numberOfLines={1}>
                      <Text style={{ color: '#9c6bff' }}>✦ </Text>
                      {item.illustrator}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pokeball: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e53935',
    borderWidth: 2.5,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e53935',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  pokeballCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#222',
  },
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '900',
    color: '#f0c040',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b6b88',
    letterSpacing: 3,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0c040',
  },
  statLabel: {
    fontSize: 9,
    color: '#6b6b88',
    letterSpacing: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#f0c04022',
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
    backgroundColor: '#a8842a55',
    marginBottom: 16,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
  },
  cardInner: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  imgWrap: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#1e1e30',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  qtyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a8842a',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f0c040',
  },
  cardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e8e8f0',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rarityBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  illustrator: {
    fontSize: 9,
    color: '#6b6b88',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  pageBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0c04055',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pageBtnDisabled: {
    borderColor: '#333',
    opacity: 0.4,
  },
  pageBtnText: {
    color: '#f0c040',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pageBtnTextDisabled: {
    color: '#666',
  },
  pageInfo: {
    color: '#e8e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
});