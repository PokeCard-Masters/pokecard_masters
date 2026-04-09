import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';
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

type PaginatedResponse = {
  items: Pokemon[];
  count: number;
};

const PAGE_SIZE = 10;

const RARITY_STYLES: Record<
  string,
  { bg: string; border: string; label: string }
> = {
  Common: { bg: 'bg-slate-100', border: 'border-slate-200', label: 'Commun' },
  Uncommon: { bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Peu commun' },
  Rare: { bg: 'bg-blue-100', border: 'border-blue-200', label: 'Rare' },
  'Ultra Rare': { bg: 'bg-amber-100', border: 'border-amber-200', label: 'Ultra rare' },
  Secret: { bg: 'bg-violet-100', border: 'border-violet-200', label: 'Secret' },
};

export default function Pokedex() {
  const { token } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>('pokedex');
  const [query, setQuery] = useState('');

  const listRef = useRef<FlatList>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const userStats = useMemo(() => {
    const rares = pokemons.filter(
      (p) => p.rarity === 'Rare' || p.rarity === 'Ultra Rare' || p.rarity === 'Secret'
    ).length;

    return {
      total: totalCount,
      rares,
      collection: pokemons.reduce((acc, p) => acc + p.quantity, 0),
    };
  }, [pokemons, totalCount]);

  const fetchPokedex = async (pageToLoad: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/pagination?page=${pageToLoad}&limit=${PAGE_SIZE}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const  PaginatedResponse = await response.json();
      setPokemons(PaginatedResponse.items);
      setTotalCount(PaginatedResponse.count);
    } catch (error) {
      console.error('Erreur fetch pokédex:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'pokedex') {
      fetchPokedex(page);
    }
  }, [page, filter]);

  const visiblePokemons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pokemons;

    return pokemons.filter((p) =>
      `${p.id} ${p.name} ${p.category ?? ''} ${p.rarity ?? ''}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [pokemons, query]);

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setPage(newPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const filters = [
    { key: 'pokedex', label: 'Tous' },
    { key: 'rares', label: 'Rares' },
    { key: 'ultra', label: 'Ultra' },
    { key: 'secret', label: 'Secret' },
  ];

  const displayList =
    filter === 'pokedex'
      ? visiblePokemons
      : pokemons.filter((p) => {
          if (filter === 'rares') return p.rarity === 'Rare';
          if (filter === 'ultra') return p.rarity === 'Ultra Rare';
          if (filter === 'secret') return p.rarity === 'Secret';
          return true;
        });

  const renderPokemon = ({ item }: { item: Pokemon }) => {
    const rarityStyle = item.rarity ? RARITY_STYLES[item.rarity] ?? RARITY_STYLES.Common : RARITY_STYLES.Common;

    return (
      <Pressable className={`flex-1 rounded-3xl border ${rarityStyle.border} bg-white p-3 shadow-sm active:scale-[0.98]`}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-400">
            #{String(item.id).padStart(3, '0')}
          </Text>
          <View className={`rounded-full px-2 py-1 ${rarityStyle.bg}`}>
            <Text className="text-[10px] font-semibold text-slate-700">
              {item.rarity ?? 'Common'}
            </Text>
          </View>
        </View>

        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-[#F5F0DC]">
            <Image
              source={{ uri: item.image }}
              className="h-20 w-20"
              resizeMode="contain"
            />
          </View>
        </View>

        <Text className="mt-3 text-base font-extrabold text-slate-900" numberOfLines={1}>
          {item.name}
        </Text>

        <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
          {item.category ?? 'Pokémon'}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-slate-500">Qté</Text>
          <Text className="text-sm font-extrabold text-[#C02A09]">{item.quantity}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />

      <FlatList
        ref={listRef}
        data={displayList}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="rounded-[32px] border border-[#E8E3C8] bg-white/80 p-4 shadow-sm">
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-[#C02A09]">
                    Pokédex
                  </Text>
                  <Text className="mt-1 text-2xl font-black text-slate-900">
                    Ma collection
                  </Text>
                </View>

                <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
                  <Text className="text-xl">⚡</Text>
                </View>
              </View>

              <View className="mb-4 flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-[#F5F0DC] p-3">
                  <Text className="text-xs font-semibold text-slate-500">Cartes</Text>
                  <Text className="mt-1 text-lg font-black text-slate-900">{userStats.total}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-[#F5F0DC] p-3">
                  <Text className="text-xs font-semibold text-slate-500">Rares</Text>
                  <Text className="mt-1 text-lg font-black text-slate-900">{userStats.rares}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-[#F5F0DC] p-3">
                  <Text className="text-xs font-semibold text-slate-500">Qté</Text>
                  <Text className="mt-1 text-lg font-black text-slate-900">{userStats.collection}</Text>
                </View>
              </View>

              <View className="rounded-2xl border border-[#E8E3C8] bg-white px-4 py-3">
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Rechercher un Pokémon..."
                  placeholderTextColor="#9CA3AF"
                  className="text-base text-slate-900"
                />
              </View>
            </View>

            <View className="mt-4">
              <FlatList
                data={filters}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => {
                  const active = filter === item.key;
                  return (
                    <Pressable
                      onPress={() => setFilter(item.key)}
                      className={`rounded-full px-4 py-2 ${
                        active ? 'bg-[#C02A09]' : 'bg-white'
                      }`}
                    >
                      <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-700'}`}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="mt-16 items-center">
              <ActivityIndicator size="large" color="#C02A09" />
              <Text className="mt-4 text-sm text-slate-600">Chargement du Pokédex...</Text>
            </View>
          ) : (
            <View className="mt-16 items-center rounded-3xl bg-white/70 p-6">
              <Text className="text-lg font-bold text-slate-900">Aucun Pokémon trouvé</Text>
              <Text className="mt-2 text-center text-sm text-slate-500">
                Essaie un autre filtre ou une autre recherche.
              </Text>
            </View>
          )
        }
        renderItem={renderPokemon}
        ListFooterComponent={
          <View className="mt-6">
            <View className="flex-row items-center justify-between rounded-3xl border border-[#E8E3C8] bg-white/80 px-4 py-3">
              <Pressable
                onPress={() => goToPage(page - 1)}
                className={`rounded-2xl px-4 py-3 ${page === 1 ? 'bg-slate-100' : 'bg-[#FFCB05]'}`}
              >
                <Text className="font-bold text-slate-900">Prev</Text>
              </Pressable>

              <Text className="text-sm font-bold text-slate-700">
                Page {page} / {totalPages}
              </Text>

              <Pressable
                onPress={() => goToPage(page + 1)}
                className={`rounded-2xl px-4 py-3 ${page === totalPages ? 'bg-slate-100' : 'bg-[#FFCB05]'}`}
              >
                <Text className="font-bold text-slate-900">Next</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}
