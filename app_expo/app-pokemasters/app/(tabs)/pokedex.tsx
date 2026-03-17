import { StyleSheet, View, Text, FlatList, Image, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/auth';

type Pokemon = {
  id: number;
  name: string;
  image: string;
  category: string | null;
  rarity: string | null;
  illustrator: string | null;
  quantity: number;
};

type RarityKey = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Secret';

const RARITY_STYLES: Record<RarityKey, { color: string; bg: string; border: string }> = {
  'Common':     { color: '#90a4ae', bg: '#90a4ae11', border: '#90a4ae44' },
  'Uncommon':   { color: '#66bb6a', bg: '#66bb6a11', border: '#66bb6a44' },
  'Rare':       { color: '#4fc3f7', bg: '#4fc3f711', border: '#4fc3f744' },
  'Ultra Rare': { color: '#f0c040', bg: '#f0c04011', border: '#f0c04044' },
  'Secret':     { color: '#9c6bff', bg: '#9c6bff11', border: '#9c6bff44' },
};

const FILTERS = ['Toutes', 'Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret'];

export default function Pokedex() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [activeFilter, setActiveFilter] = useState('Toutes');

  const getData = async () => {
    const token = Platform.OS === 'web'
      ? localStorage.getItem('auth_token')
      : await SecureStore.getItemAsync('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/player/card`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setPokemons(data);
  };

  useEffect(() => { getData(); }, []);

  const filtered = activeFilter === 'Toutes'
    ? pokemons
    : pokemons.filter(p => p.rarity === activeFilter);

  const getRarityStyle = (rarity: string | null) =>
    RARITY_STYLES[(rarity as RarityKey)] ?? RARITY_STYLES['Common'];

  const stats = {
    total: pokemons.length,
    rares: pokemons.filter(p => p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret').length,
    illustrateurs: new Set(pokemons.map(p => p.illustrator).filter(Boolean)).size,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
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
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>CARTES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.rares}</Text>
            <Text style={styles.statLabel}>RARES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.illustrateurs}</Text>
            <Text style={styles.statLabel}>ILLUS.</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Card Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const rs = getRarityStyle(item.rarity);
          return (
            <View style={styles.card}>
              <View style={[styles.cardInner, { borderColor: rs.border }]}>

                {/* Image */}
                <View style={styles.imgWrap}>
                  <Image
                    source={{ uri: item.image + '/high.png' }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  {/* Quantity badge */}
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>×{item.quantity}</Text>
                  </View>
                </View>

                {/* Name */}
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

                {/* Rarity badge */}
                {item.rarity && (
                  <View style={[styles.rarityBadge, { backgroundColor: rs.bg, borderColor: rs.border }]}>
                    <Text style={[styles.rarityText, { color: rs.color }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Illustrator */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
  },

  // Header
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

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 24,
    backgroundColor: '#a8842a55',
    marginBottom: 16,
  },

  // Filters
  filterScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.15)',
    backgroundColor: '#13131f',
  },
  filterChipActive: {
    borderColor: '#a8842a',
    backgroundColor: 'rgba(240,192,64,0.08)',
  },
  filterText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b6b88',
    letterSpacing: 1.5,
  },
  filterTextActive: {
    color: '#f0c040',
  },

  // Grid
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Card
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
});