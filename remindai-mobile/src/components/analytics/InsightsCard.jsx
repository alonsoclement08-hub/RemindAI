import { View, Text, StyleSheet } from 'react-native';

const TYPE_STYLES = {
  positive: { bg: '#EDFFF5', border: '#4CAF82', text: '#2D7A4F' },
  warning:  { bg: '#FFF8EE', border: '#F09B30', text: '#A0640A' },
  info:     { bg: '#EEF0FF', border: '#7F77DD', text: '#4A44A0' },
};

export default function InsightsCard({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <View style={styles.container}>
      {insights.map((insight, i) => {
        const s = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
        return (
          <View key={i} style={[styles.card, { backgroundColor: s.bg, borderLeftColor: s.border }]}>
            <Text style={styles.emoji}>{insight.emoji}</Text>
            <Text style={[styles.text, { color: s.text }]}>{insight.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  emoji: { fontSize: 18, lineHeight: 22 },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
