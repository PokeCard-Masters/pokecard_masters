import { StyleSheet, Text, View } from 'react-native';

type Level = 0 | 1 | 2 | 3 | 4;

const LEVELS: Record<Level, { label: string; type: string; color: string; bars: number }> = {
  0: { label: 'Aucun',     type: '—',         color: '#ddd',    bars: 0 },
  1: { label: 'Faible',    type: 'Normal',     color: '#9BAAB5', bars: 1 },
  2: { label: 'Moyen',     type: 'Eau',        color: '#4A90D9', bars: 2 },
  3: { label: 'Bien',      type: 'Plante',     color: '#5BAD57', bars: 3 },
  4: { label: 'Légendaire',type: 'Psychique ✨', color: '#C879CE', bars: 4 },
};

function getLevel(password: string): Level {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)                        score++;
  if (/[A-Z]/.test(password))                      score++;
  if (/[0-9]/.test(password))                      score++;
  if (/[^A-Za-z0-9]/.test(password))               score++;
  return Math.min(score, 4) as Level;
}

export default function PasswordStrength({ password }: { password: string }) {
  const level = getLevel(password);
  const data  = LEVELS[level];
  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= data.bars ? data.color : '#E8E3C8' },
            ]}
          />
        ))}
      </View>
      <View style={[styles.badge, { backgroundColor: data.color + '22', borderColor: data.color }]}>
        <Text style={[styles.badgeText, { color: data.color }]}>
          Type {data.type}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: -4,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});