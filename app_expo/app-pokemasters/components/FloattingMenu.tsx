import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable,  StyleSheet, Text, View, } from 'react-native';
import { useAuth } from '@/context/AuthContext';

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/users' | '/settings';
};

const menuItems: MenuItem[] = [
  {
    label: 'Profil',
    icon: 'people-outline',
    route: '/users',
  },
  {
    label: 'Paramètres',
    icon: 'settings-outline',
    route: '/settings',
  },

];

export default function FloatingUserMenu() {
  const [open, setOpen] = useState(false);
    const { signOut } = useAuth();
  

  const handleNavigate = (route: MenuItem['route']) => {
    setOpen(false);
    router.push(route as Href);
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fabButton,
          pressed && styles.fabButtonPressed,
        ]}
      >
        <Ionicons name="menu" size={24} color="#FFF" />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Text style={styles.menuTitle}>Gérer le compte</Text>
            <Text style={styles.menuSubtitle}>
              Accès rapide à l'administration de votre compte.
            </Text>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() => handleNavigate(item.route)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <View style={styles.menuItemIconWrapper}>
                    <Ionicons name={item.icon} size={18} color="#9B9EF0" />
                  </View>

                  <Text style={styles.menuItemText}>{item.label}</Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#A0A0B8"
                  />
                </Pressable>
              ))}
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutItem,
                  pressed && styles.menuItemPressed,
                ]}
              >
                <View style={styles.logoutIconWrapper}>
                  <Ionicons name="log-out-outline" size={18} color="#D9534F" />
                </View>

                <Text style={styles.logoutText}>Déconnexion</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9B9EF0',
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 17, 40, 0.18)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 250,
    backgroundColor: '#F8F8FF',
    borderRadius: 24,
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F265F',
  },
  menuSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#7D7A9A',
  },
  menuList: {
    marginTop: 14,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItemPressed: {
    backgroundColor: '#F1F1FF',
  },
  menuItemIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2F265F',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    marginTop: 6,
  },
  logoutIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#D9534F',
  },
});
