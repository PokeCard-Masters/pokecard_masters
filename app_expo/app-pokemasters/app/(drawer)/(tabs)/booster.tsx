import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';


interface Card {
  name: string;
  card_id: string;
  image: string;
  category: string;
  rarity: string;
  illustrator: string;
  booster_count: number;
}



const RARITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  'One Diamond':   { color: '#90a4ae', bg: '#90a4ae11', border: '#90a4ae44' },
  'Two Diamond':   { color: '#78909c', bg: '#78909c11', border: '#78909c44' },
  'Three Diamond': { color: '#66bb6a', bg: '#66bb6a11', border: '#66bb6a44' },
  'Four Diamond':  { color: '#26a69a', bg: '#26a69a11', border: '#26a69a44' },
  'One Shiny':     { color: '#4fc3f7', bg: '#4fc3f711', border: '#4fc3f744' },
  'One Star':      { color: '#29b6f6', bg: '#29b6f611', border: '#29b6f644' },
  'Two Star':      { color: '#9c6bff', bg: '#9c6bff11', border: '#9c6bff44' },
  'Three Star':    { color: '#7c4dff', bg: '#7c4dff11', border: '#7c4dff44' },
  'Two Shiny':     { color: '#f0c040', bg: '#f0c04011', border: '#f0c04044' },
  'Crown':         { color: '#ef5350', bg: '#ef535011', border: '#ef535044' },
};

const getRarityStyle = (rarity: string) =>
  RARITY_STYLES[rarity] ?? { color: '#6b6b88', bg: '#6b6b8811', border: '#6b6b8844' };

const PokemonBoosterOpener = () => {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - 52) / 2;
  const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.4;
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [boosterCount, setBoosterCount] = useState(0);

  const openBooster = async () => {
    if (!token) return;
    setIsOpening(true);
    setShowCards(false);
    fadeAnim.setValue(0);

    try {
      const response = await apiFetch('/api/booster/open', token, { method: 'POST' });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: { cards: Card[]; booster_count: number } = await response.json();
      setPulledCards(data.cards);
      setBoosterCount(data.booster_count);
      setIsOpening(false);
      setShowCards(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (error) {
      console.error('Error opening booster:', error);
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.pokeball}>
              <View style={styles.pokeballCenter} />
            </View>
            <Text style={styles.title}>Pokémon TCG</Text>
            <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
          </View>
          <Text style={styles.subtitle}>BOOSTER OPENER · VAULT DU DRESSEUR</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Button */}
        <View style={styles.btnWrap}>
          <TouchableOpacity
            onPress={openBooster}
            disabled={isOpening}
            activeOpacity={0.75}
            style={[styles.btn, isOpening && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>
              {isOpening ? '✦  Ouverture en cours…' : '✦  Ouvrir un Booster'}
            </Text>
          </TouchableOpacity>
          {isOpening && (
            <ActivityIndicator color="#f0c040" style={{ marginTop: 12 }} />
          )}
          <View style={styles.stat}>
              <Text style={styles.statValue}>{boosterCount}</Text>
              <Text style={styles.statLabel}>Boosters ouverts</Text>
          </View>
        </View>

        {/* Initial message */}
        {!showCards && !isOpening && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🎴</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le bouton pour ouvrir votre premier booster !
            </Text>
          </View>
        )}

        {/* Pulled cards */}
        {showCards && pulledCards.length > 0 && (
          <Animated.View style={[styles.cardsSection, { opacity: fadeAnim }]}>
            <Text style={styles.cardsTitle}>✨ Vos cartes !</Text>
            <View style={styles.cardsGrid}>
              {pulledCards.map((card, index) => {
                const rs = getRarityStyle(card.rarity ?? '');
                return (
                  <View key={index} style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                    <View style={[styles.card, { borderColor: rs.border }]}>
                      {card.image ? (
                        <Image
                          source={{ uri: `${card.image}/high.png` }}
                          style={[styles.cardImage, { height: CARD_IMAGE_HEIGHT }]}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.cardImage, styles.noImage, { height: CARD_IMAGE_HEIGHT }]}>
                          <Text style={styles.noImageText}>—</Text>
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                        <View style={[styles.rarityBadge, { backgroundColor: rs.bg, borderColor: rs.border }]}>
                          <Text style={[styles.rarityText, { color: rs.color }]}>
                            {(card.rarity ?? 'Unknown').toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.cardId}>{card.card_id}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
  },
  scroll: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
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
    fontSize: 24,
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
    backgroundColor: '#a8842a55',
    marginBottom: 28,
  },
  btnWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#f0c040',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 36,
    shadowColor: '#f0c040',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    borderColor: '#a8842a55',
    shadowOpacity: 0,
  },
  btnText: {
    color: '#f0c040',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: '#6b6b88',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  cardsSection: {
    backgroundColor: '#13131f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.15)',
    padding: 16,
  },
  cardsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0c040',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  cardsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImage: {
    width: '50%',
    backgroundColor: '#1e1e30',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#6b6b88',
    fontSize: 18,
  },
  cardInfo: {
    padding: 6,
    gap: 4,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#e8e8f0',
    textAlign: 'center',
  },
  rarityBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rarityText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardId: {
    fontSize: 8,
    color: '#6b6b88',
    fontWeight: '600',
  },
});

export default PokemonBoosterOpener;
