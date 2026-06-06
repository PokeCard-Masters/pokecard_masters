export type Rank = { label: string; emoji: string; min: number; color: string };

export const RANKS: Rank[] = [
  { label: 'Novice', emoji: '🌱', min: 0, color: '#64748b' },
  { label: 'Rookie', emoji: '⚡', min: 5, color: '#0277bd' },
  { label: 'Exploreur', emoji: '🔥', min: 15, color: '#ea580c' },
  { label: 'Expert', emoji: '💎', min: 30, color: '#6d28d9' },
  { label: 'Champion', emoji: '🏆', min: 60, color: '#b45309' },
  { label: 'Maître', emoji: '👑', min: 100, color: '#C02A09' },
];

export function getRank(boosterCount: number): Rank {
  return [...RANKS].reverse().find(r => boosterCount >= r.min) ?? RANKS[0];
}

export function getNextRank(boosterCount: number): { rank: Rank; remaining: number } | null {
  const next = RANKS.find(r => boosterCount < r.min);
  if (!next) return null;
  return { rank: next, remaining: next.min - boosterCount };
}
