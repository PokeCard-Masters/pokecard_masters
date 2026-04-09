import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const QUOTES = [
  "Le monde des Pokémon t'attend, dresseur.",
  "Même le voyage le plus long commence par un premier pas.",
  "Les Pokémon sont des créatures extraordinaires. Nous vivons et progressons avec eux.",
  "N'oublie jamais tes Pokémon, et ils ne t'oublieront jamais.",
  "Ce n'est pas toujours la quantité, mais la qualité qui compte.",
  "Tu es sur le point de vivre une grande aventure !",
];

export default function ProfChenQuote() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.prof}>Prof. Chen</Text>
      <Text style={styles.quote}>« {quote} »</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  prof: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3B4CCA',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  quote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#888',
    fontWeight: '600',
    lineHeight: 18,
  },
});