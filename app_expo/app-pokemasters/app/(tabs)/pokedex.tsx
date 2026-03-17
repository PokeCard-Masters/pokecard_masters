import { StyleSheet, View, Text, FlatList, Image } from 'react-native';
import { useEffect, useState } from 'react';

type Pokemon = {
  id: number;
  name: string;
  image: string;
  category: string | null;
  rarity: string | null;
  illustrator: string | null;
  quantity: number;
};

export default function Pokedex() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);

  const getData = async () => {
    const token = await localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/player/card', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    setPokemons(data);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokémon Cards</Text>
      <FlatList
        data={pokemons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.image + "/high.png" }}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.rarity}>{item.rarity}</Text>
            {item.illustrator && (
              <Text style={styles.illustrator}>🎨 {item.illustrator}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: 180,
    height: 250,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rarity: {
    fontSize: 14,
    color: '#888',
  },
  illustrator: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});