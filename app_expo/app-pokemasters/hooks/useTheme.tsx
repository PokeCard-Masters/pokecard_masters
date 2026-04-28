import { useRegion } from '@/context/RegionContext';

export function useTheme() {
  const { region } = useRegion();

  return {
    // ── Couleurs principales ──
    primary:    region.primary,
    secondary:  region.secondary,
    accent:     region.accent,

    // ── Surfaces (fixes sauf profil) ──
    bg:         '#F5F0DC',   
    surface:    '#ffffff',  
    border:     region.border,

    // ── Texte ──
    textAccent:  region.textAccent,
    textPrimary: '#0f172a',
    textMuted:   '#64748b',
    textFaint:   '#94a3b8',

    // ── Infos région ──
    isDark:      region.isDark,
    regionKey:   region.key,
    regionEmoji: region.emoji,
    regionLabel: region.label,

    // ── Styles préconstruits ──
    card: {
      borderRadius: 28 as const,
      borderWidth: 1 as const,
      borderColor: region.border,
      backgroundColor: '#ffffff' as const,
      shadowColor: '#000' as const,
      shadowOpacity: 0.05 as const,
      shadowRadius: 14 as const,
      elevation: 3,
    },

    button: {
      borderRadius: 999 as const,
      paddingVertical: 16 as const,
      alignItems: 'center' as const,
      backgroundColor: region.primary,
      shadowColor: region.primary,
      shadowOpacity: 0.22 as const,
      shadowRadius: 14 as const,
      elevation: 5,
    },

    buttonText: {
      fontSize: 13 as const,
      fontWeight: '900' as const,
      letterSpacing: 1.5 as const,
      color: '#ffffff' as const,
    },

    pill: (active: boolean) => ({
      borderRadius: 999 as const,
      paddingVertical: 10 as const,
      paddingHorizontal: 16 as const,
      backgroundColor: active ? region.primary : '#ffffff',
      borderWidth: 1 as const,
      borderColor: active ? region.primary : region.border,
    }),

    pillText: (active: boolean) => ({
      fontSize: 13 as const,
      fontWeight: '700' as const,
      color: active ? '#ffffff' : ('#0f172a' as string),
    }),

    progressBar: (pct: number) => ({
      height: '100%' as const,
      borderRadius: 99 as const,
      backgroundColor: region.primary,
      width: `${Math.min(100, pct)}%` as any,
    }),
  };
}
