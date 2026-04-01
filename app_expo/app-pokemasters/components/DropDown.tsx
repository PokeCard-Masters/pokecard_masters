import { API_BASE_URL } from '@/config/auth';
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

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

const STATIC_ITEMS = [
  { label: 'Voir le pokedex', value: 'pokedex' },
  { label: 'Voir mes cartes', value: 'mes_cartes' },
];

const PAGE_SIZE = 20;

export default function DropDown() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pokemonItems, setPokemonItems] = useState<{ label: string; value: string }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPaginatedCards = useCallback(async (pageToLoad: number) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/pagination?page=${pageToLoad}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

      const data: PaginatedResponse = await response.json();
      console.log('DATA REÇUE :', JSON.stringify(data)); // 👈 ajoute ça

      const newItems = data.items.map((pokemon) => ({
        label: pokemon.name,
        value: String(pokemon.id),
      }));

      setPokemonItems((prev) => [...prev, ...newItems]);

      // Plus de pages si on a tout chargé
      if (pokemonItems.length + newItems.length >= data.count) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Erreur fetch pagination :', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, pokemonItems.length]);

  useEffect(() => {
    fetchPaginatedCards(1);
  }, []);

  const handleScrollEnd = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPaginatedCards(nextPage);
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color="#f0c040" style={styles.loader} />}
      <DropDownPicker
        open={open}
        value={value}
        items={[...STATIC_ITEMS, ...pokemonItems]}
        setOpen={setOpen}
        setValue={setValue}
        setItems={() => { }}
        placeholder="Appuyez"
        listMode="SCROLLVIEW"
        onOpen={() => { if (pokemonItems.length === 0) fetchPaginatedCards(1); }}
        flatListProps={{
          onEndReached: handleScrollEnd,
          onEndReachedThreshold: 0.5,
        }}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        placeholderStyle={styles.placeholderStyle}
        labelStyle={styles.labelStyle}
        listItemLabelStyle={styles.listItemLabelStyle}
        arrowIconStyle={styles.arrowIconStyle as any}
        tickIconStyle={styles.tickIconStyle as any}
        listItemContainerStyle={styles.listItemContainerStyle}
        selectedItemContainerStyle={styles.selectedItemContainerStyle}
        selectedItemLabelStyle={styles.selectedItemLabelStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
    zIndex: 1000,
  },
  loader: {
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#1a1a2e',
    borderColor: '#a8842a55',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
  },
  dropdownContainer: {
    backgroundColor: '#1a1a2e',
    borderColor: '#a8842a55',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  placeholderStyle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  labelStyle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  arrowIconStyle: {
    tintColor: '#f0c040',
  },
  tickIconStyle: {
    tintColor: '#9c6bff',
  },
  listItemContainerStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0c04011',
  },
  selectedItemContainerStyle: {
    backgroundColor: '#9c6bff11',
  },
  selectedItemLabelStyle: {
    color: '#f0c040',
    fontWeight: '800',
  },
  listItemLabelStyle: {
    color: '#e8e8f0',
  },
});