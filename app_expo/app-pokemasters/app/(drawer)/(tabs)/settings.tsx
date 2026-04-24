import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

type Field = 'current' | 'new' | 'confirm';

export default function Settings() {
  const { token } = useAuth();

  const [current, setCurrent]   = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState<Record<Field, boolean>>({ current: false, new: false, confirm: false });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const toggleShow = (field: Field) =>
    setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    if (!current || !newPwd || !confirm) return 'Tous les champs sont requis.';
    if (newPwd.length < 8) return 'Le nouveau mot de passe doit faire au moins 8 caractères.';
    if (newPwd !== confirm) return 'Les mots de passe ne correspondent pas.';
    if (current === newPwd) return 'Le nouveau mot de passe doit être différent de l\'actuel.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

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

      if (!res.ok) {
        setError(data.detail ?? 'Une erreur est survenue.');
        return;
      }

      setSuccess(true);
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F0DC]">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 60 }}>

        {/* ── Header ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5 mb-6" style={{ elevation: 2 }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-widest text-[#C02A09]">
                Paramètres
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900">
                Mon compte
              </Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#FFCB05]">
              <Text className="text-2xl">⚙️</Text>
            </View>
          </View>
        </View>

        {/* ── Section mot de passe ── */}
        <View className="rounded-[28px] border border-[#E8E3C8] bg-white p-5" style={{ elevation: 2 }}>

          {/* Titre section */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F5F0DC]">
              <Text className="text-base">🔒</Text>
            </View>
            <View>
              <Text className="text-base font-black text-slate-900">Changer le mot de passe</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Minimum 8 caractères</Text>
            </View>
          </View>

          {/* Champ : mot de passe actuel */}
          <PasswordField
            label="Mot de passe actuel"
            value={current}
            onChangeText={setCurrent}
            visible={show.current}
            onToggle={() => toggleShow('current')}
          />

          {/* Séparateur */}
          <View className="h-px bg-[#E8E3C8] my-4" />

          {/* Champ : nouveau mot de passe */}
          <PasswordField
            label="Nouveau mot de passe"
            value={newPwd}
            onChangeText={setNewPwd}
            visible={show.new}
            onToggle={() => toggleShow('new')}
          />

          {/* Indicateur de force */}
          {newPwd.length > 0 && <StrengthBar password={newPwd} />}

          <View className="h-3" />

          {/* Champ : confirmation */}
          <PasswordField
            label="Confirmer le nouveau mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            visible={show.confirm}
            onToggle={() => toggleShow('confirm')}
            match={confirm.length > 0 ? newPwd === confirm : null}
          />

          {/* Erreur */}
          {error && (
            <View className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
              <Text className="text-sm font-semibold text-red-600">⚠ {error}</Text>
            </View>
          )}

          {/* Succès */}
          {success && (
            <View className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <Text className="text-sm font-semibold text-emerald-600">✓ Mot de passe modifié avec succès !</Text>
            </View>
          )}

          {/* Bouton */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-5 rounded-2xl py-4 items-center ${loading ? 'bg-slate-100' : 'bg-[#C02A09]'}`}
            style={{ elevation: loading ? 0 : 4 }}
          >
            {loading
              ? <ActivityIndicator color="#C02A09" />
              : <Text className="text-sm font-black tracking-wide text-white">Enregistrer</Text>
            }
          </Pressable>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Composant champ mot de passe ─────────────────────────────────────────────
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
  const borderColor = match === null || match === undefined
    ? 'border-[#E8E3C8]'
    : match ? 'border-emerald-300' : 'border-red-300';

  return (
    <View className="mb-1">
      <Text className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
        {label}
      </Text>
      <View className={`flex-row items-center rounded-2xl border ${borderColor} bg-[#FAFAF7] px-4 py-3`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-sm text-slate-900"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggle} className="ml-2 p-1">
          <Text className="text-slate-400 text-base">{visible ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
      {match === false && (
        <Text className="text-[11px] text-red-400 mt-1 ml-1">Les mots de passe ne correspondent pas</Text>
      )}
      {match === true && (
        <Text className="text-[11px] text-emerald-500 mt-1 ml-1">✓ Les mots de passe correspondent</Text>
      )}
    </View>
  );
}

// ─── Indicateur de force ──────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Très faible', color: 'bg-red-400' },
    { label: 'Faible',      color: 'bg-orange-400' },
    { label: 'Moyen',       color: 'bg-amber-400' },
    { label: 'Fort',        color: 'bg-emerald-400' },
  ];

  const current = levels[score - 1] ?? levels[0];

  return (
    <View className="mt-2 mb-1">
      <View className="flex-row gap-1 mb-1">
        {levels.map((l, i) => (
          <View
            key={i}
            className={`flex-1 h-1 rounded-full ${i < score ? current.color : 'bg-slate-200'}`}
          />
        ))}
      </View>
      <Text className="text-[11px] text-slate-400 ml-0.5">{current.label}</Text>
    </View>
  );
}