import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { dashboardAPI } from '../api/dashboard';

const PRIORITY_ICON = { urgent: '🔴', high: '🟠', normal: '📋' };

function StatCard({ icon, value, label, sublabel, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel ? <Text style={styles.statSub}>{sublabel}</Text> : null}
    </View>
  );
}

function RecommendationRow({ rec }) {
  return (
    <View style={styles.recRow}>
      <Text style={styles.recIcon}>{PRIORITY_ICON[rec.priority] || '📋'}</Text>
      <View style={styles.recContent}>
        <Text style={styles.recAction} numberOfLines={1}>{rec.action}</Text>
        <Text style={styles.recReason}>{rec.reason}</Text>
      </View>
    </View>
  );
}

export default function DailySummary({ onViewDetails }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardAPI.getDailySummary();
      setSummary(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err) {
      setError("Impossible de charger le résumé.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  // Capitalize first letter
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#7F77DD" />
        <Text style={styles.loadingText}>Analyse de ta journée...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchSummary} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (!summary) return null;

  const hasRecommendations = summary.recommendations?.length > 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Résumé du jour</Text>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
        </View>
        <Pressable onPress={fetchSummary} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>↻</Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="⚠️"
          value={summary.urgentCount}
          label="Urgents"
          sublabel="à traiter"
          color="#FFF0F0"
        />
        <StatCard
          icon="📋"
          value={summary.todoCount}
          label="À faire"
          sublabel="en attente"
          color="#F0EFFF"
        />
        <StatCard
          icon="✅"
          value={summary.completedToday}
          label="Faits"
          sublabel="aujourd'hui"
          color="#F0FFF8"
        />
      </View>

      {/* AI Note */}
      <View style={styles.aiNoteWrap}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>IA</Text>
        </View>
        <View style={styles.aiNoteBubble}>
          <Text style={styles.aiNoteText}>{summary.aiNote}</Text>
        </View>
      </View>

      {/* Recommendations (expandable) */}
      {hasRecommendations && (
        <View style={styles.recoWrap}>
          <Pressable style={styles.recoHeader} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.recoTitle}>Recommandations</Text>
            <Text style={styles.recoChevron}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
          {expanded && summary.recommendations.map((rec, i) => (
            <RecommendationRow key={i} rec={rec} />
          ))}
        </View>
      )}

      {/* Motivational message */}
      <View style={styles.motivationWrap}>
        <Text style={styles.motivationText}>{summary.motivationalMessage}</Text>
      </View>

      {/* View details */}
      {onViewDetails && (
        <Pressable style={styles.detailsBtn} onPress={onViewDetails}>
          <Text style={styles.detailsBtnText}>Voir tous les rappels  →</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  loadingWrap: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, color: '#999' },

  errorWrap: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorText: { fontSize: 13, color: '#E0654A', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E0654A',
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  dateLabel: { fontSize: 13, color: '#999', marginTop: 2 },
  refreshBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f4f4f8', alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18, color: '#7F77DD', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 2 },
  statSub: { fontSize: 10, color: '#aaa', marginTop: 1 },

  aiNoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#7F77DD',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  aiNoteBubble: {
    flex: 1,
    backgroundColor: '#f4f4f8',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 12,
  },
  aiNoteText: { fontSize: 13, color: '#333', lineHeight: 20 },

  recoWrap: {
    backgroundColor: '#f9f9fc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  recoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recoTitle: { fontSize: 13, fontWeight: '700', color: '#555' },
  recoChevron: { fontSize: 12, color: '#aaa' },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  recIcon: { fontSize: 14 },
  recContent: { flex: 1 },
  recAction: { fontSize: 13, fontWeight: '600', color: '#222' },
  recReason: { fontSize: 11, color: '#999', marginTop: 1 },

  motivationWrap: {
    backgroundColor: '#F0FFF8',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1D9E75',
    padding: 12,
    marginBottom: 14,
  },
  motivationText: { fontSize: 13, color: '#1D9E75', fontWeight: '600', lineHeight: 18 },

  detailsBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#7F77DD',
    borderRadius: 12,
  },
  detailsBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
