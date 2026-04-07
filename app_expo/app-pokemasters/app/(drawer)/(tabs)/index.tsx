import { Link } from "expo-router";
import { Text, Pressable, View, StyleSheet, StatusBar } from "react-native";
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pokeball}>
          <View style={styles.pokeballCenter} />
        </View>
        <Text style={styles.title}>Pokémon TCG</Text>
        <Text style={styles.subtitle}>VAULT DU DRESSEUR</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu */}
      <View style={styles.menu}>
        <Link href="/booster" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>✦  Ouvrir un Booster</Text>
          </Pressable>
        </Link>

        <Link href="/pokedex" asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>☰  Ma Collection</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },

  header: {
    alignItems: 'center',
    gap: 6,
  },
  pokeball: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e53935',
    borderWidth: 3,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e53935',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 12,
  },
  pokeballCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#222',
  },
  title: {
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '900',
    color: '#f0c040',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b6b88',
    letterSpacing: 3,
  },

  // Divider
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#a8842a55',
  },

  // Menu buttons
  menu: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#f0c040',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#f0c040',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#f0c040',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryBtn: {
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.2)',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#a8842a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  logoutBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  logoutText: {
    color: '#6b6b88',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});