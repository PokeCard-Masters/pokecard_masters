import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/auth';

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  badge?: string;
};

type CollectionStats = {
  total: number;
  rare: number;
  secret: number;
};

const Pokeball = ({ size = 42 }: { size?: number }) => {
  const band = 2;
  const btnSize = size * 0.24;

  return (
    <View
      style={{ width: size, height: size, borderWidth: 2, borderColor: '#1a1a2e' }}
      className="rounded-full overflow-hidden"
    >
      <View style={{ height: size / 2 }} className="bg-[#C02A09]" />
      <View style={{ height: size / 2 }} className="bg-white" />

      <View
        style={{ top: size / 2 - band / 2, height: band }}
        className="absolute left-0 right-0 bg-[#1a1a2e]"
      />

      <View
        style={{
          width: btnSize,
          height: btnSize,
          top: size / 2 - btnSize / 2,
          left: size / 2 - btnSize / 2,
          borderWidth: 2,
          borderColor: '#1a1a2e',
        }}
        className="absolute rounded-full bg-white"
      />
    </View>
  );
};

export default function FloatingUserMenu() {
  const [open, setOpen] = useState(false);
  const { user, token, signOut } = useAuth();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const menuItems: MenuItem[] = [
    { label: 'Profil dresseur', icon: 'person-outline', route: '/profil' as Href },
    { label: 'Paramètres', icon: 'settings-outline', route: '/settings' as Href },
  ];

  useEffect(() => {
    if (!open || !token || stats) return;

    const fetchStats = async () => {
      setLoadingStats(true);

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const base = `${API_BASE_URL}/api/user/collection/pagination`;

        const [resTotal, resRare, resSecret] = await Promise.all([
          fetch(`${base}?page=1&limit=1`, { headers }),
          fetch(`${base}?page=1&limit=1&rarity=Rare`, { headers }),
          fetch(`${base}?page=1&limit=1&rarity=Secret`, { headers }),
        ]);

        const [dataTotal, dataRare, dataSecret] = await Promise.all([
          resTotal.json(),
          resRare.json(),
          resSecret.json(),
        ]);

        setStats({
          total: dataTotal.count ?? 0,
          rare: dataRare.count ?? 0,
          secret: dataSecret.count ?? 0,
        });
      } catch {
        setStats({
          total: 0,
          rare: 0,
          secret: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [open, token, stats]);

  const handleMenuPress = (route: Href) => {
    setOpen(false);
    router.push(route);
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-1 items-center justify-center m-2"
        style={{ elevation: 4 }}
      >
        <Pokeball size={38} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(15, 12, 30, 0.35)' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="absolute right-4 bottom-[90px] w-[268px] rounded-3xl overflow-hidden"
            style={{ elevation: 12 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="bg-[#C02A09] px-4 pt-1 pb-4">
              <View className="h-[3px] bg-[#FFCB05] rounded-full mb-3 -mx-4" />

              <View className="flex-row items-center gap-3">
                <View className="p-1 rounded-full bg-white/10">
                  <Pokeball size={42} />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-black text-white" numberOfLines={1}>
                    {user?.name || 'Dresseur'}
                  </Text>
                  <Text className="text-[11px] text-white/70 font-medium" numberOfLines={1}>
                    {user?.email || '—'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row bg-[#F5F0DC] border-b border-[#E8E3C8]">
              {loadingStats ? (
                <View className="flex-1 items-center justify-center py-3">
                  <ActivityIndicator size="small" color="#C02A09" />
                </View>
              ) : (
                [
                  { label: 'Cartes', value: stats?.total ?? '—' },
                  { label: 'Rares', value: stats?.rare ?? '—' },
                  { label: 'Secrets', value: stats?.secret ?? '—' },
                ].map(({ label, value }, i, arr) => (
                  <View
                    key={label}
                    className={`flex-1 items-center py-3 ${
                      i < arr.length - 1 ? 'border-r border-[#E8E3C8]' : ''
                    }`}
                  >
                    <Text className="text-base font-black text-[#C02A09]">
                      {value}
                    </Text>
                    <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {label}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View className="bg-white px-3 pt-3 gap-1.5">
              {menuItems.map((item) => (
                <Pressable
                  key={String(item.route)}
                  onPress={() => handleMenuPress(item.route)}
                  className="flex-row items-center rounded-2xl border border-[#E8E3C8] bg-[#FAFAF7] px-3 py-3 active:bg-[#F5F0DC]"
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-xl bg-[#FFCB05] mr-3"
                    style={{ elevation: 1 }}
                  >
                    <Ionicons name={item.icon} size={16} color="#C02A09" />
                  </View>

                  <Text className="flex-1 text-sm font-bold text-slate-900">
                    {item.label}
                  </Text>

                  {item.badge && (
                    <View className="rounded-full bg-[#FFCB05] px-2 py-0.5 mr-1">
                      <Text className="text-[9px] font-black text-[#7a5a00]">
                        {item.badge}
                      </Text>
                    </View>
                  )}

                  <Ionicons name="chevron-forward" size={13} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>

            <View className="bg-white px-3 pt-1.5 pb-3">
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center rounded-2xl border border-red-100 bg-red-50 px-3 py-3 active:bg-red-100"
              >
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-100 mr-3">
                  <Ionicons name="log-out-outline" size={16} color="#C02A09" />
                </View>

                <Text className="flex-1 text-sm font-bold text-[#C02A09]">
                  Déconnexion
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
