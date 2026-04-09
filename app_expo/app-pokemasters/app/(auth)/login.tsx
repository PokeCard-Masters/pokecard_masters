import { useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { usePokemonLogin } from '@/hooks/usePokemonLogin';

import Pokeball from '@/components/login_components/pokeball';
import BackgroundCards from '@/components/login_components/BackgroundCard';
import ParticlesBackground from '@/components/login_components/ParticlesBackground';
import LightningOverlay from '@/components/login_components/LightOverlay';
import PasswordStrength from '@/components/login_components/PasswordStrenght';
import StarterPicker from '@/components/login_components/StarterPicker';
import ProfChenQuote from '@/components/login_components/Quote';
import SkeletonLoader from '@/components/login_components/SkeletonLoader';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const { signIn, signInWithPassword, isLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [starter, setStarter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  const {
    shakeAnim, lightningRef, easterEgg, easterCount,
    shakePokeball, hapticLight, hapticError, hapticSuccess,
    playSuccessSound, triggerLightning, checkEasterEgg,
  } = usePokemonLogin();

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F5F0DC', '#EEF2F7']} style={StyleSheet.absoluteFill} />
        <SkeletonLoader />
      </View>
    );
  }

  const handleLogin = async () => {
    setError(null);
    triggerLightning();
    if (!email.trim() || !password) {
      setError('Remplis tous les champs, dresseur !');
      shakePokeball();
      hapticError();
      return;
    }
    setSubmitting(true);
    const err = await signInWithPassword(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err);
      shakePokeball();
      hapticError();
    } else {
      hapticSuccess();
      await playSuccessSound();
      setTimeout(() => router.replace('/(drawer)/(tabs)/booster'), 400);
    }
  };

  const handleRegister = async () => {
    setError(null);
    triggerLightning();
    if (!username.trim() || !email.trim() || !password || !starter) {
      setError(!starter ? 'Choisis ton Pokémon de départ !' : 'Remplis tous les champs !');
      shakePokeball();
      hapticError();
      return;
    }
    // TODO: brancher ta logique d'inscription
  };

  const switchTab = (t: Tab) => {
    hapticLight();
    setTab(t);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F5F0DC', '#EEF2F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <BackgroundCards />
      <ParticlesBackground />
      <LightningOverlay ref={lightningRef} />

      {/* Easter egg ⚡ */}
      {easterEgg && (
        <View style={styles.easterEgg} pointerEvents="none">
          <Text style={styles.easterEmoji}>⚡</Text>
          <Text style={styles.easterText}>PIKA PIKA !</Text>
          {easterCount > 1 && (
            <Text style={styles.easterSub}>×{easterCount} fois... sérieusement ?</Text>
          )}
        </View>
      )}

      <View style={[styles.card, { zIndex: 2 }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.orbTopRight} />
          <View style={styles.orbBottomLeft} />

          <View style={styles.headerRow}>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <Pokeball size={56} />
            </Animated.View>

            <View style={styles.headerText}>
              <Text style={styles.brandName}>PokeMasters</Text>
              <View style={styles.hpBadge}>
                <Text style={styles.hpNum}>100</Text>
                <Text style={styles.hpLabel}> HP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Bande dorée ── */}
        <View style={styles.stripe} />

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Tabs */}
          <View style={styles.tabPills}>
            <Pressable
              style={[styles.tabPill, tab === 'login' && styles.tabPillActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                ⚡ Connexion
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabPill, tab === 'register' && styles.tabPillActive]}
              onPress={() => switchTab('register')}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                🌟 Inscription
              </Text>
            </Pressable>
          </View>

          {/* Citation Prof Chen */}
          <ProfChenQuote />

          {/* Erreur */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Connexion ── */}
          {tab === 'login' && (
            <>
              <Text style={styles.sectionLabel}>Attaque — Identification</Text>

              <TextInput
                style={styles.input}
                placeholder="ash@pallet.town"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={text => { setEmail(text); checkEasterEgg(text); }}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe secret"
                placeholderTextColor="#bbb"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={styles.btnPrimary}
                onPress={handleLogin}
                disabled={submitting}
              >
                <Text style={styles.btnPrimaryText}>
                  {submitting ? '⏳ Connexion...' : '⚡ Se connecter'}
                </Text>
              </Pressable>

              <Pressable onPress={() => switchTab('register')}>
                <Text style={styles.link}>Première aventure ? S'inscrire →</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={styles.btnGoogle} onPress={() => { hapticLight(); signIn(); }}>
                <Image source={require('@/asset/google-logo.png')} style={styles.googleLogo} />
                <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
              </Pressable>
            </>
          )}

          {/* ── Inscription ── */}
          {tab === 'register' && (
            <>
              <Text style={styles.sectionLabel}>Nouvelle Aventure</Text>

              <StarterPicker value={starter} onChange={setStarter} />

              <TextInput
                style={styles.input}
                placeholder="Nom de dresseur"
                placeholderTextColor="#bbb"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={styles.input}
                placeholder="ash@pallet.town"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe secret"
                placeholderTextColor="#bbb"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <PasswordStrength password={password} />

              <Pressable
                style={styles.btnPrimary}
                onPress={handleRegister}
                disabled={submitting}
              >
                <Text style={styles.btnPrimaryText}>
                  {submitting ? '⏳ Inscription...' : "🚀 Commencer l'aventure"}
                </Text>
              </Pressable>

              <Pressable onPress={() => switchTab('login')}>
                <Text style={styles.link}>← Déjà dresseur ? Se connecter</Text>
              </Pressable>
            </>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Niveau 1 · Région de Kanto</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>⚡ Électrik</Text>
          </View>
        </View>

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
  },

  // ── Easter egg ──
  easterEgg: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255,203,5,0.95)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  easterEmoji: { fontSize: 36 },
  easterText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#E3350D',
  },
  easterSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C02A09',
  },

  // ── Carte ──
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFEF8',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D4A017',
    shadowColor: '#C8A800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  // ── Header ──
  header: {
    backgroundColor: '#E3350D',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  orbTopRight: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orbBottomLeft: {
    position: 'absolute', bottom: -40, left: -20,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 },
  headerText: { flex: 1, gap: 8 },
  brandName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 15, color: '#FFCB05', letterSpacing: 0.5,
  },
  hpBadge: {
    flexDirection: 'row', alignItems: 'baseline', alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  hpNum: { fontFamily: 'PressStart2P_400Regular', fontSize: 13, color: '#fff' },
  hpLabel: { fontFamily: 'PressStart2P_400Regular', fontSize: 7, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },

  // ── Bande ──
  stripe: { height: 6, backgroundColor: '#FFCB05' },

  // ── Body ──
  body: { padding: 28 },

  tabPills: {
    flexDirection: 'row', backgroundColor: '#F0EDE0',
    borderRadius: 10, padding: 4, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#D4C080',
  },
  tabPill: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 7 },
  tabPillActive: {
    backgroundColor: '#E3350D',
    shadowColor: '#E3350D', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  tabText: { fontFamily: 'PressStart2P_400Regular', fontSize: 7.5, color: '#999' },
  tabTextActive: { color: '#FFCB05' },

  errorBox: { backgroundColor: '#FFF0EE', borderWidth: 1.5, borderColor: '#E3350D', borderRadius: 8, padding: 10, marginBottom: 14 },
  errorText: { color: '#C02A09', fontSize: 12, fontWeight: '800' },

  sectionLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8, color: '#3B4CCA',
    letterSpacing: 1.5, marginBottom: 14,
  },

  input: {
    backgroundColor: '#FAFAF2', borderWidth: 2, borderColor: '#DDD9C0',
    borderRadius: 10, padding: 13, fontSize: 14,
    fontWeight: '700', color: '#222', marginBottom: 12,
  },

  btnPrimary: {
    backgroundColor: '#E3350D', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
    marginTop: 4, marginBottom: 14,
    shadowColor: '#8B1E07',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10, color: '#FFCB05', letterSpacing: 0.3,
  },

  link: {
    color: '#3B4CCA', fontSize: 12, fontWeight: '800',
    textAlign: 'center', marginBottom: 18, textDecorationLine: 'underline',
  },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: '#E8E3C8', borderRadius: 2 },
  dividerText: { fontFamily: 'PressStart2P_400Regular', fontSize: 7, color: '#bbb' },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#DDD9C0',
    borderRadius: 10, paddingVertical: 13,
    shadowColor: '#DDD9C0', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  googleLogo: { width: 20, height: 20 },
  btnGoogleText: { fontSize: 14, fontWeight: '800', color: '#333' },

  // ── Footer ──
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0EDE0', borderTopWidth: 1.5, borderTopColor: '#DDD9C0',
    paddingHorizontal: 28, paddingVertical: 10,
  },
  footerText: { fontFamily: 'PressStart2P_400Regular', fontSize: 7, color: '#aaa' },
  typeBadge: { backgroundColor: '#3B4CCA', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontFamily: 'PressStart2P_400Regular', fontSize: 7, color: '#fff' },
});

