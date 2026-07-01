import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const CAT_LABELS = {
  work: 'Travail', health: 'Santé', errand: 'Courses',
  habit: 'Habitudes', personal: 'Personnel', call: 'Appels',
};

export default function RemHabitsCard({ habits, loading }) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>Rem</Text></View>
          <Text style={styles.title}>Rem analyse tes habitudes…</Text>
        </View>
        <ActivityIndicator size="small" color="#7F77DD" style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!habits) return null;

  const { insight, recommendation, tip, patterns } = habits;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>Rem</Text></View>
        <Text style={styles.title}>Analyse de tes habitudes</Text>
      </View>

      {insight ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{insight}</Text>
        </View>
      ) : null}

      {patterns && (
        <View style={styles.stats}>
          {patterns.bestDay ? (
            <View style={styles.statPill}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statLabel}>Meilleur jour</Text>
              <Text style={styles.statValue}>{patterns.bestDay}</Text>
            </View>
          ) : null}
          {patterns.bestHour != null ? (
            <View style={styles.statPill}>
              <Text style={styles.statEmoji}>🕐</Text>
              <Text style={styles.statLabel}>Heure forte</Text>
              <Text style={styles.statValue}>{patterns.bestHour}h</Text>
            </View>
          ) : null}
          {patterns.worstCategory ? (
            <View style={[styles.statPill, styles.statPillWarn]}>
              <Text style={styles.statEmoji}>⚠️</Text>
              <Text style={styles.statLabel}>À améliorer</Text>
              <Text style={[styles.statValue, { color: '#B35C00' }]}>
                {CAT_LABELS[patterns.worstCategory] || patterns.worstCategory}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {recommendation ? (
        <View style={styles.recoBox}>
          <Text style={styles.recoLabel}>💡 Conseil</Text>
          <Text style={styles.recoText}>{recommendation}</Text>
        </View>
      ) : null}

      {tip ? (
        <Text style={styles.tip}>{tip}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },

  bubble: {
    backgroundColor: '#f4f4f8',
    borderRadius: 14, borderTopLeftRadius: 4,
    padding: 12,
  },
  bubbleText: { fontSize: 14, color: '#333', lineHeight: 21 },

  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: {
    flex: 1, minWidth: 90,
    backgroundColor: '#F0F0FF', borderRadius: 10, padding: 10,
    alignItems: 'center', gap: 2,
  },
  statPillWarn: { backgroundColor: '#FFF8EE' },
  statEmoji: { fontSize: 16 },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#4A44A0' },

  recoBox: {
    backgroundColor: '#F0FFF7',
    borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#1D9E75',
    gap: 4,
  },
  recoLabel: { fontSize: 11, fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase' },
  recoText: { fontSize: 14, color: '#333', lineHeight: 20 },

  tip: { fontSize: 13, color: '#888', fontStyle: 'italic', textAlign: 'center' },
});
