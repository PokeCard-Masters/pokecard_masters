import { Pressable, StyleSheet, Text, View } from 'react-native';

const STARTERS = [
  { id: 'bulbasaur',  name: 'Bulbizarre', emoji: '🌿', color: '#5BAD57', bg: '#EAF5E9' },
  { id: 'charmander', name: 'Salamèche',  emoji: '🔥', color: '#E3350D', bg: '#FFF0EE' },
  { id: 'squirtle',   name: 'Carapuce',   emoji: '💧', color: '#4A90D9', bg: '#EEF5FF' },
];

type Starter = typeof STARTERS[0]['id'];

export default function StarterPicker({
  value,
  onChange,
}: {
  value: Starter | null;
  onChange: (s: Starter) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choisis ton starter</Text>
      <View style={styles.row}>
        {STARTERS.map(s => {
          const active = value === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onChange(s.id as Starter)}
              style={[
                styles.card,
                { backgroundColor: s.bg, borderColor: active ? s.color : '#E8E3C8' },
                active && styles.cardActive,
              ]}
            >
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={[styles.name, { color: active ? s.color : '#999' }]}>
                {s.name}
              </Text>
              {active && <View style={[styles.dot, { backgroundColor: s.color }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
    position: 'relative',
  },
  cardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emoji: { fontSize: 26 },
  name: {
    fontSize: 9,
    fontWeight: '800',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});