import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { signIn, signInWithPassword, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    const err = await signInWithPassword(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokeMasters</Text>
      <Text style={styles.subtitle}>Sign in to manage your collection</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.loginButton} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Sign in"}</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>Don't have an account? Create one</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable style={styles.googleButton} onPress={signIn}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    justifyContent: 'center',
    alignContent: 'center',
    fontSize: 50,
    color: 'black',
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32
  },
  input: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: { color: "#e53e3e", marginBottom: 12, fontSize: 14 },
  loginButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
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
    marginBottom: 16
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
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
});
