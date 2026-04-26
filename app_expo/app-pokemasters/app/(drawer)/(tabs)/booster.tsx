import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
  Pressable,
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



const RARITY_STYLES: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  'One Diamond':   { bg: '#90a4ae11', border: '#90a4ae44', dot: 'bg-slate-400',   label: 'One Diamond' },
  'Two Diamond':   { bg: '#78909c11', border: '#78909c44', dot: 'bg-slate-500',   label: 'Two Diamond' },
  'Three Diamond': { bg: '#66bb6a11', border: '#66bb6a44', dot: 'bg-emerald-400', label: 'Three Diamond' },
  'Four Diamond':  { bg: '#26a69a11', border: '#26a69a44', dot: 'bg-teal-500',    label: 'Four Diamond' },
  'One Shiny':     { bg: '#4fc3f711', border: '#4fc3f744', dot: 'bg-blue-400',    label: 'One Shiny' },
  'One Star':      { bg: '#29b6f611', border: '#29b6f644', dot: 'bg-sky-500',     label: 'One Star' },
  'Two Star':      { bg: '#9c6bff11', border: '#9c6bff44', dot: 'bg-violet-500',  label: 'Two Star' },
  'Three Star':    { bg: '#7c4dff11', border: '#7c4dff44', dot: 'bg-purple-600',  label: 'Three Star' },
  'Two Shiny':     { bg: '#f0c04011', border: '#f0c04044', dot: 'bg-amber-400',   label: 'Two Shiny' },
  'Crown':         { bg: '#ef535011', border: '#ef535044', dot: 'bg-red-500',     label: 'Crown' },
};

const getRarityStyle = (rarity: string) =>
  RARITY_STYLES[rarity] ?? { bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400', label: rarity };

const PokemonBoosterOpener = () => {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - 60) / 3;
  const CARD_IMAGE_HEIGHT = CARD_WIDTH * 0.9;
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [boosterCount, setBoosterCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/booster/count', token)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setBoosterCount(data.booster_count); })
      .catch(() => {});
  }, [token]);

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
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 60 }}>

                {/* ── Hero card ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
                Pokémon TCG
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900">
                Booster Opener
              </Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
              <Text className="text-2xl">🎴</Text>
            </View>
          </View>
 
          {/* Stats */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl bg-[#F5F0DC] py-3">
              <Text className="text-lg font-black text-slate-900">{boosterCount}</Text>
              <Text className="mt-0.5 text-[10px] font-semibold text-slate-500">Boosters ouverts</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-[#F5F0DC] py-3">
              <Text className="text-lg font-black text-slate-900">
                {pulledCards.filter(c =>
                  ['One Star','Two Star','Three Star','Two Shiny','Crown'].includes(c.rarity)
                ).length}
              </Text>
              <Text className="mt-0.5 text-[10px] font-semibold text-slate-500">Rares</Text>
            </View>
          </View>
        </View>
 
        {/* ── Bouton ouvrir ── */}
        <Pressable
          onPress={openBooster}
          disabled={isOpening}
          className={`rounded-3xl py-5 items-center mb-4 border ${
            isOpening
              ? 'bg-slate-100 border-slate-200'
              : 'bg-[#C02A09] border-[#C02A09]'
          }`}
          style={{ elevation: isOpening ? 0 : 4 }}
        >
          {isOpening ? (
            <View className="flex-row items-center gap-3">
              <ActivityIndicator color="#C02A09" />
              <Text className="text-base font-bold text-slate-500">Ouverture en cours…</Text>
            </View>
          ) : (
            <Text className="text-base font-black text-white tracking-wide">
              ✦  Ouvrir un Booster
            </Text>
          )}
        </Pressable>
 
        {/* ── Message initial ── */}
        {!showCards && !isOpening && (
          <View className="mt-8 items-center rounded-3xl bg-white/70 p-6 border border-[#E8E3C8]">
            <Text className="text-4xl mb-3">🎴</Text>
            <Text className="text-base font-bold text-slate-900 mb-1">Prêt à ouvrir ?</Text>
            <Text className="text-sm text-slate-500 text-center">
              Appuyez sur le bouton pour ouvrir votre premier booster !
            </Text>
          </View>
        )}
 
        {/* ── Cartes tirées ── */}
        {showCards && pulledCards.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
 
            {/* Titre section */}
            <View className="flex-row items-center justify-between mb-4 px-1">
              <Text className="text-lg font-black text-slate-900">✨ Vos cartes !</Text>
              <View className="rounded-full bg-[#FFCB05] px-3 py-1">
                <Text className="text-xs font-black text-slate-900">
                  {pulledCards.length} cartes
                </Text>
              </View>
            </View>
 
            {/* Grille de cartes */}
            <View className="flex-row flex-wrap gap-3">
              {pulledCards.map((card, index) => {
                const rs = getRarityStyle(card.rarity ?? '');
                return (
                  <View
                    key={index}
                    style={{ width: CARD_WIDTH }}
                    className={`rounded-2xl border-2 ${rs.border} bg-white p-2 shadow-sm`}
                  >
                    {/* Header carte */}
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-400">
                        {card.card_id}
                      </Text>
                      <View className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${rs.bg}`}>
                        <View className={`h-1.5 w-1.5 rounded-full ${rs.dot}`} />
                        <Text className="text-[9px] font-bold text-slate-700">
                          {rs.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>
 
                    {/* Image */}
                    <View className="items-center">
                      <View
                        className="items-center justify-center rounded-2xl bg-[#F5F0DC]"
                        style={{ width: CARD_WIDTH - 24, height: CARD_IMAGE_HEIGHT }}
                      >
                        {card.image ? (
                          <Image
                            source={{ uri: `${card.image}/high.png` }}
                            style={{ width: CARD_WIDTH - 32, height: CARD_IMAGE_HEIGHT - 16 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text className="text-slate-400 text-2xl">—</Text>
                        )}
                      </View>
                    </View>
 
                    {/* Infos */}
                    <Text className="mt-2 text-[11px] font-extrabold text-slate-900" numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text className="mt-0.5 text-[9px] text-slate-400" numberOfLines={1}>
                      {card.category ?? 'Pokémon'}
                    </Text>
                    {card.illustrator && (
                      <Text className="mt-1 text-[10px] text-slate-400" numberOfLines={1}>
                        ✦ {card.illustrator}
                      </Text>
                    )}
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
 
export default PokemonBoosterOpener;
