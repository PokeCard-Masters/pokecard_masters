import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'react-native'
import Pokeball from '@/components/pokeball'

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
  const GoogleLogo = ({ size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );

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
