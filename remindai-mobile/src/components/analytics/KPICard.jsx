import { View, Text, StyleSheet } from 'react-native';

export default function KPICard({ emoji, label, value, sub, subColor, bg = '#f5f5ff' }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub != null && (
        <Text style={[styles.sub, subColor ? { color: subColor } : null]}>{sub}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  emoji: { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
  label: { fontSize: 11, color: '#888', marginTop: 3, fontWeight: '500', textAlign: 'center' },
  sub: { fontSize: 12, color: '#4CAF82', fontWeight: '700', marginTop: 4 },
});
