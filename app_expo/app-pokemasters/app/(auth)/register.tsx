import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'react-native'
import Pokeball from '@/components/login_components/pokeball'

export default function RegisterScreen() {
  const { register, signIn,  isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  if (!fontsLoaded || isLoading) {
    return <ActivityIndicator size="large" />;
  }
  
  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const err = await register(name.trim(), email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E9F6E9', '#AA99EC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Pokeball size={75} />
        </View>
        <Text style={styles.title}>PokeMasters</Text>
        <Text>{' '}</Text>
        <Text style={styles.subtitle}>Inscrit toi et rejoins l'aventure!⚡️</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.registerButton} onPress={handleRegister} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? "Création du compte..." : "Rejoindre l'aventure"}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Déjà dresseur ? Connecte toi ici</Text>
        </Pressable>
        <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>
        
                <Pressable style={styles.googleButton} onPress={signIn}>
                  <Text style={styles.buttonText}>Continuer avec Google
                    <Text>{' '}</Text>
                    <Image
                      source={require('@/asset/google-logo.png')}
                      style={{ width: 24, height: 24 }}
                    />
                  </Text>
                </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#654DC4',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 0,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 25, height: 25 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontStyle: 'normal',
    fontFamily: 'PressStart2P_400Regular',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: "100%",
    maxWidth: 460,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: { color: "#e53e3e", marginBottom: 12, fontSize: 14 },
  registerButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: "#1A211E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  link: {
    color: "#2563eb",
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 460,
    marginBottom: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc"
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontSize: 14
  },
  ball: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHalf: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '50%',
  },
  stripe: {
    position: 'absolute',
    left: 0, right: 0,
    backgroundColor: '#111',
    top: '50%',
    zIndex: 1,
  },
  bottomHalf: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '50%',
  },
  btnOuter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: '#fff',
  },
  btnInner: {
  },
  pokeball: {
    alignContent: 'center',
    marginBottom: 24,
  }
})
