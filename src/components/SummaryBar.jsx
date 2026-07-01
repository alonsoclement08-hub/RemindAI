import { View, Text, Pressable, StyleSheet } from 'react-native';

const CHIPS = [
  { key: 'today',    label: (n) => `${n} aujourd'hui`, color: '#7F77DD', bg: '#EDEAFF' },
  { key: 'tomorrow', label: (n) => `${n} demain`,       color: '#4A90E2', bg: '#E4EFFF' },
  { key: 'overdue',  label: (n) => `${n} en retard`,    color: '#E0654A', bg: '#FDEAE6' },
  { key: 'later',    label: (n) => `${n} plus tard`,    color: '#888',    bg: '#F0F0F0' },
];

export default function SummaryBar({ counts = {}, activeFilter, onFilter }) {
  const visible = CHIPS.filter((c) => (counts[c.key] ?? 0) > 0);
  if (visible.length === 0) return null;

  return (
    <View style={styles.bar}>
      {visible.map(({ key, label, color, bg }) => {
        const active = activeFilter === key;
        return (
          <Pressable
            key={key}
            style={[styles.chip, { backgroundColor: active ? color : bg }]}
            onPress={() => onFilter(active ? null : key)}
            testID={`filter-${key}`}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : color }]}>
              {label(counts[key])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});
