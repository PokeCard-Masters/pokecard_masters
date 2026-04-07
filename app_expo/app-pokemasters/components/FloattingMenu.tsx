import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

export default function FloatingUserMenu() {
  const [open, setOpen] = useState(false);
  const {user, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    { label: 'Profil', icon: 'person-outline', route: '/profile' },
    { label: 'Paramètres', icon: 'settings-outline', route: '/settings' },
  ];

  const handleMenuPress = (route: string) => {
    setOpen(false);
    router.push(route as Href);
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Ionicons name="menu" size={24} color="#fff" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <View style={styles.userHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle-outline" size={48} color="#6B46C1" />
              </View>

              <Text style={styles.userName} numberOfLines={1}>
                { user?.name || 'Utilisateur'}
              </Text>

              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'Chargement...'}
              </Text>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={20} color="#6B46C1" />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.logoutItem,
                pressed && styles.logoutItemPressed,
              ]}
              onPress={handleLogout}
            >
              <View style={styles.logoutIconWrapper}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 17, 40, 0.18)',
    justifyContent: 'flex-end',
  },
  menu: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 260,
    backgroundColor: '#F8F8FF',
    borderRadius: 24,
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  userHeader: {
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DBFF',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 18,
  },
  avatarContainer: {
    marginBottom: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 999,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2F265F',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  menuList: {
    marginTop: 10,
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
  iconContainer: {
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
    marginTop: 10,
  },
  logoutItemPressed: {
    backgroundColor: '#FDECEC',
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
