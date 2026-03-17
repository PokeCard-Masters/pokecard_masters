import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Card {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity: string;
  types?: string[];
  hp?: number;
  images?: {
    small?: string;
    large?: string;
  };
}

interface SetData {
  id: string;
  name: string;
  logo: string;
  cardCount: { total: number };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 5;

// ─── Rarity config ────────────────────────────────────────────────────────────
type RarityKey =
  | 'One Diamond' | 'Two Diamond' | 'Three Diamond' | 'Four Diamond'
  | 'One Shiny' | 'One Star' | 'Two Star' | 'Three Star'
  | 'Two Shiny' | 'Crown';

const RARITY_STYLES: Record<string, { color: string; bg: string; border: string; weight: number }> = {
  'One Diamond':   { color: '#90a4ae', bg: '#90a4ae11', border: '#90a4ae44', weight: 60 },
  'Two Diamond':   { color: '#78909c', bg: '#78909c11', border: '#78909c44', weight: 30 },
  'Three Diamond': { color: '#66bb6a', bg: '#66bb6a11', border: '#66bb6a44', weight: 15 },
  'Four Diamond':  { color: '#26a69a', bg: '#26a69a11', border: '#26a69a44', weight: 8  },
  'One Shiny':     { color: '#4fc3f7', bg: '#4fc3f711', border: '#4fc3f744', weight: 5  },
  'One Star':      { color: '#29b6f6', bg: '#29b6f611', border: '#29b6f644', weight: 4  },
  'Two Star':      { color: '#9c6bff', bg: '#9c6bff11', border: '#9c6bff44', weight: 2.5},
  'Three Star':    { color: '#7c4dff', bg: '#7c4dff11', border: '#7c4dff44', weight: 1.5},
  'Two Shiny':     { color: '#f0c040', bg: '#f0c04011', border: '#f0c04044', weight: 0.8},
  'Crown':         { color: '#ef5350', bg: '#ef535011', border: '#ef535044', weight: 0.3},
};

const getRarityStyle = (rarity: string) =>
  RARITY_STYLES[rarity] ?? { color: '#6b6b88', bg: '#6b6b8811', border: '#6b6b8844', weight: 5 };

// ─── Component ────────────────────────────────────────────────────────────────
const PokemonBoosterOpener = () => {
  const [setData, setSetData]       = useState<SetData | null>(null);
  const [allCards, setAllCards]     = useState<Card[]>([]);
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [isOpening, setIsOpening]   = useState(false);
  const [showCards, setShowCards]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [fadeAnim]                  = useState(new Animated.Value(0));

  useEffect(() => { fetchSetData(); }, []);

  useEffect(() => {
    if (showCards) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [showCards]);

  const fetchSetData = async () => {
    try {
      const setResponse = await fetch('https://api.tcgdex.net/v2/en/sets/A4');
      const setDataJson = await setResponse.json();

      if (setDataJson.cards && Array.isArray(setDataJson.cards)) {
        setSetData(setDataJson);
        setAllCards(setDataJson.cards);
        setLoading(false);
        return;
      }

      const totalCards = setDataJson.cardCount?.total || 226;
      const cardPromises = Array.from({ length: totalCards }, (_, i) => {
        const cardId = `A4-${String(i + 1).padStart(3, '0')}`;
        return fetch(`https://api.tcgdex.net/v2/fr/cards/${cardId}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);
      });

      const results = (await Promise.all(cardPromises)).filter(Boolean);
      setSetData(setDataJson);
      setAllCards(results);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  const openBooster = () => {
    if (allCards.length === 0) return;
    setIsOpening(true);
    setShowCards(false);
    fadeAnim.setValue(0);

    setTimeout(() => {
      const cards: Card[] = [];
      const commonRarities   = ['One Diamond', 'Two Diamond'];
      const uncommonRarities = ['Three Diamond', 'Four Diamond'];
      const rareRarities     = ['One Shiny', 'One Star', 'Two Star', 'Three Star', 'Two Shiny', 'Crown'];

      const pick = (pool: Card[], count: number) => {
        const copy = [...pool];
        for (let i = 0; i < count && copy.length > 0; i++) {
          const idx = Math.floor(Math.random() * copy.length);
          cards.push(copy[idx]);
          copy.splice(idx, 1);
        }
      };

      pick(allCards.filter(c => commonRarities.includes(c.rarity)), 6);
      pick(allCards.filter(c => uncommonRarities.includes(c.rarity) && !cards.find(e => e.id === c.id)), 2);

      // Sélection pondérée pour les rares
      const rarePool = allCards.filter(c => rareRarities.includes(c.rarity) && !cards.find(e => e.id === c.id));
      for (let i = 0; i < 2 && rarePool.length > 0; i++) {
        const total = rarePool.reduce((s, c) => s + getRarityStyle(c.rarity).weight, 0);
        let rand = Math.random() * total;
        for (const card of rarePool) {
          rand -= getRarityStyle(card.rarity).weight;
          if (rand <= 0) { cards.push(card); rarePool.splice(rarePool.indexOf(card), 1); break; }
        }
      }

      while (cards.length < 10) {
        const remaining = allCards.filter(c => !cards.find(e => e.id === c.id));
        if (!remaining.length) break;
        cards.push(remaining[Math.floor(Math.random() * remaining.length)]);
      }

      setPulledCards(cards);
      setIsOpening(false);
      setShowCards(true);
    }, 1500);
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingWrap}>
          <View style={styles.pokeball}>
            <View style={styles.pokeballCenter} />
          </View>
          <ActivityIndicator size="large" color="#f0c040" style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Chargement du set…</Text>
        </View>
      </View>
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          {setData?.logo && (
            <Image
              source={{ uri: `${setData.logo}/high.png` }}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <View style={styles.headerRow}>
            <View style={styles.pokeball}>
              <View style={styles.pokeballCenter} />
            </View>
            <Text style={styles.title}>{setData?.name || 'Pokémon TCG'}</Text>
          </View>
          <Text style={styles.subtitle}>BOOSTER OPENER · VAULT DU DRESSEUR</Text>
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{setData?.cardCount.total ?? '—'}</Text>
              <Text style={styles.statLabel}>CARTES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pulledCards.length}</Text>
              <Text style={styles.statLabel}>TIRÉES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {pulledCards.filter(c => ['One Star','Two Star','Three Star','Two Shiny','Crown'].includes(c.rarity)).length}
              </Text>
              <Text style={styles.statLabel}>RARES</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bouton */}
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
        </View>

        {/* Message initial */}
        {!showCards && !isOpening && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🎴</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le bouton pour ouvrir votre premier booster !
            </Text>
          </View>
        )}

        {/* Cartes tirées */}
        {showCards && pulledCards.length > 0 && (
          <Animated.View style={[styles.cardsSection, { opacity: fadeAnim }]}>
            <Text style={styles.cardsTitle}>✨ Vos cartes !</Text>
            <View style={styles.cardsGrid}>
              {pulledCards.map((card, index) => {
                const rs = getRarityStyle(card.rarity ?? '');
                return (
                  <View key={index} style={styles.cardWrapper}>
                    <View style={[styles.card, { borderColor: rs.border }]}>
                      {card.image ? (
                        <Image
                          source={{ uri: `${card.image}/high.png` }}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.cardImage, styles.noImage]}>
                          <Text style={styles.noImageText}>—</Text>
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                        <View style={[styles.rarityBadge, { backgroundColor: rs.bg, borderColor: rs.border }]}>
                          <Text style={[styles.rarityText, { color: rs.color as string  }]}>
                            {(card.rarity ?? 'Unknown').toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.cardId}>{card.localId}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b6b88',
    fontSize: 14,
    marginTop: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Header
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
  logo: {
    width: 200,
    height: 70,
    marginBottom: 8,
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
    backgroundColor: '#a8842a55',
    marginBottom: 28,
  },

  // Button
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

  // Empty state
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

  // Cards section
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },

  // Card
  cardWrapper: {
    width: 400,
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
    width: '100%',
    height: 250 * 1.4,
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

aconst styles = StyleSheet.create({ 
    container: {
        flex: 1,
        backgroundColor: '#F8F8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#202020',
    },
})
