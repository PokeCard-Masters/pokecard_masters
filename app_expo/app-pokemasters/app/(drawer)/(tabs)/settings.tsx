import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { apiFetch } from '@/services/api';

type Field = 'current' | 'new' | 'confirm';

type User = {
  id: number;
  name: string;
  email: string;
};

// ─── Strength bar ─────────────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels: { label: string; color: string }[] = [
    { label: 'Très faible', color: '#ef4444' },
    { label: 'Faible', color: '#f97316' },
    { label: 'Moyen', color: '#f59e0b' },
    { label: 'Fort', color: '#22c55e' },
  ];

  const current = levels[score - 1] ?? levels[0];

  return (
    <View style={{ marginTop: 8, marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 5 }}>
        {levels.map((l, i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 99,
              backgroundColor: i < score ? current.color : '#E2E8F0',
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: score >= 3 ? '#22c55e' : '#94a3b8', fontWeight: '600' }}>
        {current.label}
      </Text>
    </View>
  );
}

// ─── Password field ───────────────────────────────────────────────────────────

function PasswordField({
  label, value, onChangeText, visible, onToggle, match,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  match?: boolean | null;
}) {
  const borderColor =
    match === true ? '#86efac' :
      match === false ? '#fca5a5' :
        '#E2E8F0';

  const bgColor =
    match === true ? '#f0fdf4' :
      match === false ? '#fff1f2' :
        '#FAFAFA';

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{
        fontSize: 11, fontWeight: '800', color: '#64748b',
        marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {label}
      </Text>

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, borderWidth: 1.5, borderColor,
        backgroundColor: bgColor,
        paddingHorizontal: 14, paddingVertical: 12,
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggle} style={{ padding: 4, marginLeft: 8 }}>
          <Text style={{ fontSize: 16 }}>{visible ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>

      {match === false && (
        <Text style={{ fontSize: 11, color: '#f87171', marginTop: 5, marginLeft: 2 }}>
          ✕  Les mots de passe ne correspondent pas
        </Text>
      )}
      {match === true && (
        <Text style={{ fontSize: 11, color: '#4ade80', marginTop: 5, marginLeft: 2 }}>
          ✓  Les mots de passe correspondent
        </Text>
      )}
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  emoji, label, value, primary,
}: {
  emoji: string; label: string; value: string; primary: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0EDE4',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 999,
        backgroundColor: primary + '15',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 1 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  emoji, title, subtitle, primary,
}: {
  emoji: string; title: string; subtitle?: string; primary: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <View style={{
        width: 42, height: 42, borderRadius: 999,
        backgroundColor: primary + '15',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a' }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Animated card ────────────────────────────────────────────────────────────

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0, duration: 420,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 360, useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      {children}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { token } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const isPhone = width < 640;
  const sidePad = isPhone ? 16 : 24;
  const maxWidth = Math.min(width, 680);

  const [user, setUser] = useState<User | null>(null);
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState<Record<Field, boolean>>({
    current: false, new: false, confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleShow = (field: Field) =>
    setShow(prev => ({ ...prev, [field]: !prev[field] }));

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/me', token)
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setUser(data))
      .catch(() => { });
  }, [token]);

  const validate = () => {
    if (!current || !newPwd || !confirm) return 'Tous les champs sont requis.';
    if (newPwd.length < 8) return 'Le nouveau mot de passe doit faire au moins 8 caractères.';
    if (newPwd !== confirm) return 'Les mots de passe ne correspondent pas.';
    if (current === newPwd) return "Le nouveau mot de passe doit être différent de l'actuel.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await apiFetch('/api/auth/change-password', token!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: newPwd }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.detail ?? 'Une erreur est survenue.'); return; }

      setSuccess(true);
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#ffffff',
    padding: isPhone ? 18 : 22,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          paddingTop: 24,
          paddingBottom: 52,
          alignSelf: 'center',
          width: '100%',
          maxWidth: maxWidth,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <AnimatedCard delay={0}>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{
                  fontSize: 11, fontWeight: '900', letterSpacing: 2,
                  color: theme.textAccent, textTransform: 'uppercase',
                }}>
                  Paramètres
                </Text>
                <Text style={{
                  marginTop: 4, fontSize: isPhone ? 24 : 28,
                  fontWeight: '900', color: '#0f172a',
                }}>
                  Mon compte
                </Text>
                <Text style={{ marginTop: 5, fontSize: 13, color: '#64748b', fontWeight: '600' }}>
                  Gérez vos informations et votre sécurité
                </Text>
              </View>
              <View style={{
                width: isPhone ? 56 : 64, height: isPhone ? 56 : 64,
                borderRadius: 999, backgroundColor: theme.primary,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: theme.primary, shadowOpacity: 0.2,
                shadowRadius: 10, elevation: 4,
              }}>
                <Text style={{ fontSize: isPhone ? 26 : 30 }}>⚙️</Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* ── Infos compte ── */}
        {user && (
          <AnimatedCard delay={100}>
            <View style={cardStyle}>
              <SectionHeader
                emoji="👤"
                title="Informations"
                subtitle="Votre profil"
                primary={theme.primary}
              />
              <InfoRow emoji="✉️" label="Adresse e-mail" value={user.email} primary={theme.primary} />
              <InfoRow emoji="🏷️" label="Nom d'affichage" value={user.name} primary={theme.primary} />
              <InfoRow emoji="🆔" label="Identifiant" value={`#${String(user.id).padStart(5, '0')}`} primary={theme.primary} />
            </View>
          </AnimatedCard>
        )}

        {/* ── Changer mot de passe ── */}
        <AnimatedCard delay={200}>
          <View style={cardStyle}>
            <SectionHeader
              emoji="🔒"
              title="Changer le mot de passe"
              subtitle="Minimum 8 caractères"
              primary={theme.primary}
            />

            <PasswordField
              label="Mot de passe actuel"
              value={current}
              onChangeText={setCurrent}
              visible={show.current}
              onToggle={() => toggleShow('current')}
            />

            <View style={{ height: 1, backgroundColor: '#F0EDE4', marginVertical: 16 }} />

            <PasswordField
              label="Nouveau mot de passe"
              value={newPwd}
              onChangeText={setNewPwd}
              visible={show.new}
              onToggle={() => toggleShow('new')}
            />

            {newPwd.length > 0 && <StrengthBar password={newPwd} />}

            <View style={{ height: 14 }} />

            <PasswordField
              label="Confirmer le nouveau mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              visible={show.confirm}
              onToggle={() => toggleShow('confirm')}
              match={confirm.length > 0 ? newPwd === confirm : null}
            />

            {error && (
              <View style={{
                marginTop: 16, borderRadius: 16,
                backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3',
                paddingHorizontal: 14, paddingVertical: 12,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#dc2626' }}>
                  {error}
                </Text>
              </View>
            )}

            {success && (
              <View style={{
                marginTop: 16, borderRadius: 16,
                backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
                paddingHorizontal: 14, paddingVertical: 12,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#16a34a' }}>
                  Mot de passe modifié avec succès !
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => ({
                marginTop: 20,
                borderRadius: 999,
                paddingVertical: 16,
                alignItems: 'center',
                backgroundColor: loading ? '#E2E8F0' : theme.primary,
                shadowColor: loading ? 'transparent' : theme.primary,
                shadowOpacity: loading ? 0 : 0.25,
                shadowRadius: 14,
                elevation: loading ? 0 : 5,
                transform: [{ scale: pressed && !loading ? 0.98 : 1 }],
              })}
            >
              {loading
                ? <ActivityIndicator color="#94a3b8" />
                : (
                  <Text style={{
                    fontSize: 13, fontWeight: '900',
                    letterSpacing: 1.5, color: '#ffffff',
                  }}>
                    ✦  ENREGISTRER
                  </Text>
                )
              }
            </Pressable>
          </View>
        </AnimatedCard>

      </ScrollView>
    </View>
  );
}
