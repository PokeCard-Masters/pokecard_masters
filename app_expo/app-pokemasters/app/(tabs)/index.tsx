import { Link } from "expo-router";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { token, signIn, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
      <Text> ## Menu ##</Text>
      <Link href={"/about"} style={styles.button}>CLiquez ici pour jouer</Link>
    </View >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'grey',
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textDecorationLine: 'underline',
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "600",
  }, logoutButton: {
    backgroundColor: '#EA4335',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  }
})