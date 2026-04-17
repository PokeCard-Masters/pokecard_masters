import * as Haptics from 'expo-haptics';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'ultra';

export const RARITY_TIER_MAP: Record<string, RarityTier> = {
  'One Diamond':   'common',
  'Two Diamond':   'common',
  'Three Diamond': 'uncommon',
  'Four Diamond':  'uncommon',
  'One Shiny':     'rare',
  'One Star':      'rare',
  'Two Star':      'ultra',
  'Three Star':    'ultra',
  'Two Shiny':     'ultra',
  'Crown':         'ultra',
};

export const TIER_VISUAL: Record<RarityTier, {
  label: string;
  symbol: string;
  color: string;
  border: string;
  shimmer: readonly string[];
}> = {
  common:   { label: 'Commun',     symbol: '♦',  color: '#90a4ae', border: '#90a4ae55', shimmer: [] },
  uncommon: { label: 'Peu commun', symbol: '♦♦', color: '#66bb6a', border: '#66bb6a55', shimmer: [] },
  rare:     { label: 'Rare',       symbol: '★',  color: '#4fc3f7', border: '#4fc3f788',
              shimmer: ['transparent', 'rgba(79,195,247,0.45)', 'rgba(156,107,255,0.45)', 'transparent'] },
  ultra:    { label: 'Ultra Rare', symbol: '★★', color: '#f0c040', border: '#f0c04088',
              shimmer: ['transparent', 'rgba(240,192,64,0.5)', 'rgba(227,53,13,0.4)', 'rgba(59,76,202,0.4)', 'rgba(240,192,64,0.5)', 'transparent'] },
};

export function getRarityTier(rarity: string): RarityTier {
  return RARITY_TIER_MAP[rarity] ?? 'common';
}

export async function hapticForRarity(rarity: string): Promise<void> {
  const tier = getRarityTier(rarity);
  try {
    switch (tier) {
      case 'common':   await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);   break;
      case 'uncommon': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  break;
      case 'rare':     await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);   break;
      case 'ultra':    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    }
  } catch { /* silencieux */ }
}

export async function playRaritySound(rarity: string): Promise<void> {
  const tier = getRarityTier(rarity);
  try {
    const { Audio } = await import('expo-av');
    let asset: number;
    switch (tier) {
      case 'ultra':    asset = require('@/assets/sounds/ultra_reveal.mp3');    break;
      case 'rare':     asset = require('@/assets/sounds/rare_reveal.mp3');     break;
      case 'uncommon': asset = require('@/assets/sounds/uncommon_reveal.mp3'); break;
      default:         asset = require('@/assets/sounds/common_reveal.mp3');
    }
    const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, volume: 0.5 });
    sound.setOnPlaybackStatusUpdate(s => {
      if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
    });
  } catch { /* silencieux si fichiers absents */ }
}