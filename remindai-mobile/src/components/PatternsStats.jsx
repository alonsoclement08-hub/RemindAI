import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { budgetAPI } from '../api/budget';

const CATEGORY_ICONS = { work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄', call: '📞' };

function completionMessage(rate) {
  if (rate >= 90) return 'Incroyable, tu es inarrêtable ! 🔥';
  if (rate >= 80) return 'Excellent travail, continue comme ça ! 👏';
  if (rate >= 70) return 'Bien joué, tu complètes la plupart ! 😊';
  if (rate >= 50) return 'Pas mal, mais il y a de la marge ! 💪';
  return 'Allez, on peut faire mieux ensemble ! 🙌';
}

function completionColor(rate) {
  if (rate >= 80) return '#1D9E75';
  if (rate >= 50) return '#FFB800';
  return '#E0654A';
}

function CategoryBar({ category, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const icon = CATEGORY_ICONS[category] || '📌';
  return (
    <View style={styles.catRow}>
      <Text style={styles.catIcon}>{icon}</Text>
      <View style={styles.catBarWrap}>
        <View style={[styles.catBarFill, { width: `${Math.round(pct)}%` }]} />
      </View>
      <Text style={styles.catCount}>{count}x</Text>
    </View>
  );
}

export default function PatternsStats() {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await budgetAPI.getSmartRecommendations();
      setPatterns(result.patterns ?? null);
    } catch {
      setError('Statistiques indisponibles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#7F77DD" />
        <Text style={styles.loadingText}>Analyse de tes patterns...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (!patterns) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Tes patterns</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Complète quelques rappels pour voir tes statistiques ici !</Text>
        </View>
      </View>
    );
  }

  const topCats = patterns.topCategories?.slice(0, 3) ?? [];
  const maxCount = topCats[0]?.count ?? 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Tes patterns</Text>
        <Pressable style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshIcon}>↻</Text>
        </Pressable>
      </View>

      {topCats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Catégories favorites</Text>
          {topCats.map((item) => (
            <CategoryBar key={item.category} category={item.category} count={item.count} maxCount={maxCount} />
          ))}
        </View>
      )}

      <View style={styles.gridRow}>
        {patterns.favoriteDay && (
          <View style={styles.gridCell}>
            <Text style={styles.gridEmoji}>📅</Text>
            <Text style={styles.gridValue}>{patterns.favoriteDay}</Text>
            <Text style={styles.gridLabel}>Jour préféré</Text>
          </View>
        )}
        {patterns.favoriteTime && (
          <View style={styles.gridCell}>
            <Text style={styles.gridEmoji}>🕐</Text>
            <Text style={styles.gridValue}>{patterns.favoriteTime}</Text>
            <Text style={styles.gridLabel}>Heure préférée</Text>
          </View>
        )}
        {patterns.lightestDay && (
          <View style={styles.gridCell}>
            <Text style={styles.gridEmoji}>😌</Text>
            <Text style={styles.gridValue}>{patterns.lightestDay}</Text>
            <Text style={styles.gridLabel}>Jour + léger</Text>
          </View>
        )}
      </View>

      {typeof patterns.completionRate === 'number' && (
        <View style={[styles.completionWrap, { borderLeftColor: completionColor(patterns.completionRate) }]}>
          <View style={styles.completionRow}>
            <Text style={[styles.completionRate, { color: completionColor(patterns.completionRate) }]}>
              {patterns.completionRate} %
            </Text>
            <Text style={styles.completionLabel}>taux de complétion</Text>
          </View>
          <Text style={styles.completionMsg}>{completionMessage(patterns.completionRate)}</Text>
          <View style={styles.completionBarTrack}>
            <View style={[styles.completionBarFill, {
              width: `${Math.min(100, patterns.completionRate)}%`,
              backgroundColor: completionColor(patterns.completionRate),
            }]} />
          </View>
        </View>
      )}

      {typeof patterns.totalReminders === 'number' && (
        <Text style={styles.footer}>{patterns.totalReminders} rappel{patterns.totalReminders > 1 ? 's' : ''} analysé{patterns.totalReminders > 1 ? 's' : ''}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#7F77DD', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  loadingText: { fontSize: 13, color: '#999', marginTop: 8, textAlign: 'center' },
  errorText: { fontSize: 13, color: '#E0654A', textAlign: 'center' },
  retryBtn: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 8 },
  retryBtnText: { fontSize: 13, color: '#555' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  refreshBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 14, color: '#7F77DD', fontWeight: '700' },

  emptyWrap: { paddingVertical: 12 },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  catIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  catBarWrap: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: 8, backgroundColor: '#7F77DD', borderRadius: 4 },
  catCount: { fontSize: 12, fontWeight: '700', color: '#7F77DD', width: 32, textAlign: 'right' },

  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gridCell: { flex: 1, backgroundColor: '#f8f8fc', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  gridEmoji: { fontSize: 20 },
  gridValue: { fontSize: 13, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  gridLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },

  completionWrap: { backgroundColor: '#f8f8f8', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#7F77DD' },
  completionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  completionRate: { fontSize: 28, fontWeight: '900' },
  completionLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  completionMsg: { fontSize: 13, color: '#555', marginBottom: 10 },
  completionBarTrack: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  completionBarFill: { height: 6, borderRadius: 3 },

  footer: { fontSize: 11, color: '#ccc', textAlign: 'center' },
});
