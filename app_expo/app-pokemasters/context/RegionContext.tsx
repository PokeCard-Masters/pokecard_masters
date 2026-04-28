import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

export type Region = {
    key: string;
    label: string;
    emoji: string;
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    border: string;
    textAccent: string;
    isDark: boolean;
};

export const REGIONS: Region[] = [
    {
        key: 'Kanto', label: 'Kanto', emoji: '🔴',
        primary: '#C02A09', secondary: '#7f1d1d', accent: '#FFCB05',
        bg: '#FDF5F3', surface: '#FFFFFF', border: '#F5D5CF',
        textAccent: '#C02A09', isDark: true,
    },
    {
        key: 'Johto', label: 'Johto', emoji: '🌙',
        primary: '#6d28d9', secondary: '#3b0764', accent: '#c4b5fd',
        bg: '#F7F4FD', surface: '#FFFFFF', border: '#DDD6FE',
        textAccent: '#6d28d9', isDark: true,
    },
    {
        key: 'Hoenn', label: 'Hoenn', emoji: '🌊',
        primary: '#0277bd', secondary: '#01579b', accent: '#4fc3f7',
        bg: '#F2F8FD', surface: '#FFFFFF', border: '#BAE0F7',
        textAccent: '#0277bd', isDark: true,
    },
    {
        key: 'Sinnoh', label: 'Sinnoh', emoji: '❄️',
        primary: '#1e40af', secondary: '#1e3a8a', accent: '#93c5fd',
        bg: '#F2F5FD', surface: '#FFFFFF', border: '#BFCFEE',
        textAccent: '#1e40af', isDark: true,
    },
    {
        key: 'Unova', label: 'Unova', emoji: '🏙️',
        primary: '#334155', secondary: '#0f172a', accent: '#94a3b8',
        bg: '#F4F5F7', surface: '#FFFFFF', border: '#CBD5E1',
        textAccent: '#334155', isDark: true,
    },
    {
        key: 'Kalos', label: 'Kalos', emoji: '🌸',
        primary: '#be185d', secondary: '#831843', accent: '#f9a8d4',
        bg: '#FDF4F8', surface: '#FFFFFF', border: '#FBCFE8',
        textAccent: '#be185d', isDark: true,
    },
    {
        key: 'Alola', label: 'Alola', emoji: '🌺',
        primary: '#ea580c', secondary: '#9a3412', accent: '#fdba74',
        bg: '#FEF6F2', surface: '#FFFFFF', border: '#FED7AA',
        textAccent: '#ea580c', isDark: true,
    },
    {
        key: 'Galar', label: 'Galar', emoji: '⚔️',
        primary: '#15803d', secondary: '#14532d', accent: '#86efac',
        bg: '#F2FBF5', surface: '#FFFFFF', border: '#BBF7D0',
        textAccent: '#15803d', isDark: true,
    },
    {
        key: 'Paldea', label: 'Paldea', emoji: '✨',
        primary: '#b45309', secondary: '#78350f', accent: '#fcd34d',
        bg: '#FEF9F0', surface: '#FFFFFF', border: '#FDE68A',
        textAccent: '#b45309', isDark: true,
    },
];

export function getRegion(key: string): Region {
    return REGIONS.find(r => r.key === key) ?? REGIONS[0];
}

type RegionContextType = {
    region: Region;
    setRegion: (key: string) => Promise<void>;
    loading: boolean;
};

const RegionContext = createContext<RegionContextType>({
    region: REGIONS[0],
    setRegion: async () => { },
    loading: false,
});

export function RegionProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const [region, setRegionState] = useState<Region>(REGIONS[0]);
    const [loading, setLoading] = useState(true);

    // Charger la région depuis le profil au démarrage
    useEffect(() => {
        if (!token) return;
        apiFetch('/api/me/profile', token)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.region) setRegionState(getRegion(data.region));
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    const setRegion = useCallback(async (key: string) => {
        if (!token) return;
        const next = getRegion(key);
        setRegionState(next); // optimistic update
        try {
            await apiFetch('/api/me/region', token, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: key }),
            });
        } catch {
            console.error('Failed to save region');
        }
    }, [token]);

    return (
        <RegionContext.Provider value={{ region, setRegion, loading }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion() {
    return useContext(RegionContext);
}
