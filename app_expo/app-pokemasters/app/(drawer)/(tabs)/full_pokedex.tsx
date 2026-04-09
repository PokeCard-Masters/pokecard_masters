import {
  StyleSheet, View, Text, FlatList, Image,
  StatusBar, Platform, TouchableOpacity, Modal,
  ActivityIndicator, Animated,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Pokemon = {
  id: number;
  name: string;
  image: string;
  category: string | null;
  rarity: string | null;
  illustrator: string | null;
  quantity: number;
  owned: boolean;
};

type RarityKey = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Secret';
type FilterMode = 'all' | 'owned';

// ---------------------------------------------------------------------------
// Rarity styles
// ---------------------------------------------------------------------------

const RARITY_STYLES: Record<RarityKey, { color: string; bg: string; border: string }> = {
  'Common':     { color: '#90a4ae', bg: '#90a4ae11', border: '#90a4ae44' },
  'Uncommon':   { color: '#66bb6a', bg: '#66bb6a11', border: '#66bb6a44' },
  'Rare':       { color: '#4fc3f7', bg: '#4fc3f711', border: '#4fc3f744' },
  'Ultra Rare': { color: '#f0c040', bg: '#f0c04011', border: '#f0c04044' },
  'Secret':     { color: '#9c6bff', bg: '#9c6bff11', border: '#9c6bff44' },
};

// Coûts de craft affichés dans l'UI (doit correspondre au backend)
const CRAFT_COSTS: Record<string, number> = {
  'One Diamond': 20,   'Two Diamond': 40,
  'Three Diamond': 80, 'Four Diamond': 160,
  'One Star': 400,     'Two Star': 1000,
  'Three Star': 2000,  'One Shiny': 600,
  'Two Shiny': 1600,   'Crown': 4000,
  'Common': 20,        'Uncommon': 40,
  'Unusual': 40,       'Rare': 320,
  'Ultra Rare': 800,   'Ex': 1200,
  'X': 1600,           'Full Art': 2000,
  'Shiny Gold': 3200,
};

// Valeurs de décraftage affichées dans l'UI
const DISENCHANT_VALUES: Record<string, number> = {
  'One Diamond': 5,    'Two Diamond': 10,
  'Three Diamond': 20, 'Four Diamond': 40,
  'One Star': 100,     'Two Star': 250,
  'Three Star': 500,   'One Shiny': 150,
  'Two Shiny': 400,    'Crown': 1000,
  'Common': 5,         'Uncommon': 10,
  'Unusual': 10,       'Rare': 80,
  'Ultra Rare': 200,   'Ex': 300,
  'X': 400,            'Full Art': 500,
  'Shiny Gold': 800,
};

// ---------------------------------------------------------------------------
// Toast component
// ---------------------------------------------------------------------------

function Toast({ message, color }: { message: string; color: string }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.toast, { borderColor: color, opacity }]}>
      <Text style={[styles.toastText, { color }]}>{message}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Confirm Modal
// ---------------------------------------------------------------------------

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

function ConfirmModal({
  visible, title, body, confirmLabel, confirmColor,
  onConfirm, onCancel, loading,
}: ConfirmModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, { borderColor: confirmColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={confirmColor} />
                : <Text style={[styles.modalConfirmText, { color: confirmColor }]}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function Pokedex() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [dust, setDust] = useState<number>(0);

  // Confirm modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string; body: string; confirmLabel: string;
    confirmColor: string; action: () => Promise<void>;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; color: string; key: number } | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const getToken = async () =>
    Platform.OS === 'web'
      ? localStorage.getItem('auth_token')
      : await SecureStore.getItemAsync('auth_token');

  const showToast = (msg: string, color = '#f0c040') => {
    setToast({ msg, color, key: Date.now() });
    setTimeout(() => setToast(null), 2500);
  };

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const getData = async () => {
    const token = await getToken();
    const [cardsRes, dustRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/cards/all`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/dust`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const cardsData = await cardsRes.json();
    const dustData = await dustRes.json();
    setPokemons(cardsData);
    setDust(dustData.dust ?? 0);
  };

  useEffect(() => { getData(); }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleDisenchant = (item: Pokemon) => {
    const available = Math.max(0, item.quantity - 2);
    const dustValue = DISENCHANT_VALUES[item.rarity ?? ''] ?? 5;

    setModalConfig({
      title: '✦ Décrafter',
      body: `Décrafter 1 exemplaire de «${item.name}» ?\n\nTu conserveras ${item.quantity - 1} exemplaire(s).\n+${dustValue} ✦ poussière`,
      confirmLabel: `+${dustValue} ✦`,
      confirmColor: '#f0c040',
      action: async () => {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/disenchant`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ card_id: item.id, quantity: 1 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail ?? 'Erreur');
        setDust(data.dust_total);
        setPokemons(prev => prev.map(p =>
          p.id === item.id ? { ...p, quantity: data.remaining_quantity } : p
        ));
        showToast(`+${data.dust_earned} ✦ — ${item.name} décraftée !`, '#f0c040');
      },
    });
    setModalVisible(true);
  };

  const handleCraft = (item: Pokemon) => {
    const cost = CRAFT_COSTS[item.rarity ?? ''] ?? 20;

    setModalConfig({
      title: '⚙ Crafter',
      body: `Crafter «${item.name}» ?\n\nCoût : ${cost} ✦ poussière\nTon solde : ${dust} ✦`,
      confirmLabel: `−${cost} ✦`,
      confirmColor: '#9c6bff',
      action: async () => {
        if (dust < cost) throw new Error(`Poussière insuffisante (${cost} ✦ requis)`);
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/craft`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ card_id: item.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail ?? 'Erreur');
        setDust(data.dust_total);
        setPokemons(prev => prev.map(p =>
          p.id === item.id ? { ...p, owned: true, quantity: p.quantity + 1 } : p
        ));
        showToast(`⚙ ${item.name} craftée ! −${data.dust_spent} ✦`, '#9c6bff');
      },
    });
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!modalConfig) return;
    setModalLoading(true);
    try {
      await modalConfig.action();
      setModalVisible(false);
    } catch (e: any) {
      showToast(e.message ?? 'Erreur', '#e53935');
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const getRarityStyle = (rarity: string | null) =>
    RARITY_STYLES[(rarity as RarityKey)] ?? RARITY_STYLES['Common'];

  const owned = pokemons.filter(p => p.owned);
  const filtered = filter === 'owned' ? owned : pokemons;

  const stats = {
    total: pokemons.length,
    owned: owned.length,
    completion: pokemons.length > 0 ? Math.round((owned.length / pokemons.length) * 100) : 0,
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.pokeball}>
              <View style={styles.pokeballCenter} />
            </View>
            <Text style={styles.title}>
              {filter === 'all' ? 'Pokédex' : 'Ma Collection'}
            </Text>
          </View>

          {/* Toggle */}

          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, filter === 'all' && styles.toggleBtnActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.toggleText, filter === 'all' && styles.toggleTextActive]}>
                Pokédex
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filter === 'owned' && styles.toggleBtnActive]}
              onPress={() => setFilter('owned')}
            >
              <Text style={[styles.toggleText, filter === 'owned' && styles.toggleTextActive]}>
                Collection
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dust balance badge */}
          <View style={styles.dustBadge}>
            <Text style={styles.dustIcon}>✦</Text>
            <Text style={styles.dustValue}>{dust.toLocaleString()}</Text>
          </View>
        </View>        

        <Text style={styles.subtitle}>POKÉMON TCG · VAULT DU DRESSEUR</Text>

        {/* Completion bar */}
        <View style={styles.completionWrap}>
          <Text style={styles.completionCompact}>
            {stats.owned}/{stats.total} · {stats.completion}% 
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${stats.completion}%` as any }]} />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Card Grid ──────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const rs = getRarityStyle(item.rarity);
          const isOwned = item.owned;
          const canDisenchant = isOwned && item.quantity > 2;
          const craftCost = CRAFT_COSTS[item.rarity ?? ''] ?? 20;
          const canCraft = (item.quantity <= 1) && dust >= craftCost;

          return (
            <View style={styles.card}>
              <View style={[
                styles.cardInner,
                { borderColor: isOwned ? rs.border : '#2a2a3a' },
                !isOwned && styles.cardLocked,
              ]}>

                {/* Image */}
                <View style={styles.imgWrap}>
                  <Image
                    source={{ uri: item.image + '/high.png' }}
                    style={[styles.image, !isOwned && styles.imageGray]}
                    resizeMode="contain"
                  />

                  {isOwned && (
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>×{item.quantity}</Text>
                    </View>
                  )}

                  {!isOwned && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>?</Text>
                    </View>
                  )}
                </View>

                {/* Name */}
                <Text style={[styles.cardName, !isOwned && styles.textMuted]} numberOfLines={1}>
                  {isOwned ? item.name : '???'}
                </Text>

                {/* Rarity badge */}
                {item.rarity && (
                  <View style={[
                    styles.rarityBadge,
                    isOwned
                      ? { backgroundColor: rs.bg, borderColor: rs.border }
                      : { backgroundColor: '#1e1e2e', borderColor: '#2a2a3a' },
                  ]}>
                    <Text style={[styles.rarityText, { color: isOwned ? rs.color : '#3a3a5a' }]}>
                      {isOwned ? item.rarity!.toUpperCase() : '· · ·'}
                    </Text>
                  </View>
                )}

                {/* Illustrator */}
                {isOwned && item.illustrator && (
                  <Text style={styles.illustrator} numberOfLines={1}>
                    <Text style={{ color: '#9c6bff' }}>✦ </Text>
                    {item.illustrator}
                  </Text>
                )}

                {/* ── Action buttons ── */}

                {/* Disenchant : carte possédée en > 2 exemplaires */}
                {canDisenchant && (
                  <TouchableOpacity
                    style={styles.disenchantBtn}
                    onPress={() => handleDisenchant(item)}
                  >
                    <Text style={styles.disenchantIcon}>⬦</Text>
                    <Text style={styles.disenchantText}>
                      +{DISENCHANT_VALUES[item.rarity ?? ''] ?? 5} ✦
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Craft : carte non possédée */}
                {item.quantity <= 1 && (
                  <TouchableOpacity
                    style={[styles.craftBtn, !canCraft && styles.craftBtnDisabled]}
                    onPress={() => canCraft && handleCraft(item)}
                    disabled={!canCraft}
                  >
                    <Text style={[styles.craftText, !canCraft && styles.craftTextDisabled]}>
                      {canCraft ? `⚙ Crafter − ${craftCost} ✦` : `🔒 ${craftCost} ✦`}
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          );
        }}
      />

      {/* ── Confirm Modal ────────────────────────────── */}
      {modalConfig && (
        <ConfirmModal
          visible={modalVisible}
          title={modalConfig.title}
          body={modalConfig.body}
          confirmLabel={modalConfig.confirmLabel}
          confirmColor={modalConfig.confirmColor}
          onConfirm={handleConfirm}
          onCancel={() => setModalVisible(false)}
          loading={modalLoading}
        />
      )}

      {/* ── Toast ───────────────────────────────────── */}
      {toast && <Toast key={toast.key} message={toast.msg} color={toast.color} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    justifyContent: 'space-between',
    width: '100%',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Dust badge
  dustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a8842a66',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dustIcon: {
    fontSize: 12,
    color: '#f0c040',
  },
  dustValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f0c040',
    letterSpacing: 0.5,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#12121e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    padding: 3,
    gap: 2,
    marginTop: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: '#f0c04020',
    borderWidth: 1,
    borderColor: '#f0c04066',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3a3a5a',
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: '#f0c040',
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

  // Completion
  completionWrap: {
    width: '100%',
    marginTop: 14,
    gap: 6,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completionLabel: {
    fontSize: 9,
    color: '#6b6b88',
    letterSpacing: 2,
  },
  completionValue: {
    fontSize: 9,
    color: '#f0c040',
    fontWeight: '700',
    letterSpacing: 1,
  },
  completionCompact: {
  fontSize: 10,
  color: '#f0c040',
  fontWeight: '700',
  letterSpacing: 0.5,
  textAlign: 'right',
  },
  progressBg: {
    height: 3,
    backgroundColor: '#1e1e30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f0c040',
    borderRadius: 2,
  },

  divider: {
    height: 1,
    marginHorizontal: 24,
    backgroundColor: '#a8842a55',
    marginBottom: 12,
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
  cardLocked: {
    backgroundColor: '#12121e',
    opacity: 0.7,
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
  imageGray: {
    opacity: 0.25,
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 18, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 32,
    color: '#2a2a4a',
    fontWeight: '900',
  },
  cardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e8e8f0',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  textMuted: {
    color: '#2a2a4a',
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

  // ── Disenchant button
  disenchantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#a8842a18',
    borderWidth: 1,
    borderColor: '#a8842a66',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  disenchantIcon: {
    fontSize: 10,
    color: '#f0c040',
  },
  disenchantText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f0c040',
    letterSpacing: 0.5,
  },

  // ── Craft button
  craftBtn: {
    backgroundColor: '#9c6bff22',
    borderWidth: 1,
    borderColor: '#9c6bff88',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
    alignItems: 'center',
  },
  craftBtnDisabled: {
    backgroundColor: '#1e1e2e',
    borderColor: '#2a2a3a',
  },
  craftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9c6bff',
    letterSpacing: 0.5,
  },
  craftTextDisabled: {
    color: '#3a3a5a',
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: '#12121e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e8e8f0',
    letterSpacing: 0.5,
  },
  modalBody: {
    fontSize: 13,
    color: '#9898b0',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b6b88',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Toast
  toast: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: '#0d0d1a',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});