import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { aiAPI } from '../api/ai';
import { useRemindersStore } from '../store/reminders.store';

const CATEGORY_ICONS = { work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄', call: '📞' };
const CONFIDENCE_COLOR = (c) => c >= 0.85 ? '#1D9E75' : c >= 0.7 ? '#FFB800' : '#aaa';

function RecoCard({ rec, onCreateReminder, onFeedback }) {
  const [creating, setCreating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const icon = CATEGORY_ICONS[rec.category] || '📌';

  const handleCreate = async () => {
    setCreating(true);
    try {
      onFeedback('liked');
      await onCreateReminder(rec);
    } finally {
      setCreating(false);
    }
  };

  const handleDislike = () => {
    setFeedbackGiven('disliked');
    onFeedback('disliked');
  };

  if (feedbackGiven === 'disliked') {
    return (
      <View style={[styles.card, styles.cardDismissed]}>
        <Text style={styles.dismissedText}>Suggestion masquée — l'IA s'adapte 🧠</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{rec.title}</Text>
        <Text style={styles.cardReason} numberOfLines={2}>"{rec.reason}"</Text>
        {rec.suggestedTime && (
          <Text style={styles.cardTime}>
            🕐 {rec.suggestedTime}{rec.suggestedDay ? ` · ${rec.suggestedDay}` : ''}
          </Text>
        )}
        <View style={styles.feedbackRow}>
          <Pressable style={styles.dislikeBtn} onPress={handleDislike}>
            <Text style={styles.dislikeBtnText}>👎 Pas utile</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.confidence, { color: CONFIDENCE_COLOR(rec.confidence || 0.5) }]}>
          {Math.round((rec.confidence || 0.5) * 100)} %
        </Text>
        <Pressable style={[styles.createBtn, creating && styles.createBtnDisabled]} onPress={handleCreate} disabled={creating}>
          <Text style={styles.createBtnText}>{creating ? '…' : '+ Créer'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RecommendationsWidget({ onReminderCreated }) {
  const { create } = useRemindersStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiAPI.getSmartRecommendations();
      setData(result);
    } catch {
      setError("Recommandations indisponibles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreateReminder = useCallback(async (rec) => {
    let scheduledAt = null;
    if (rec.suggestedTime) {
      const [h, m] = rec.suggestedTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d < new Date()) d.setDate(d.getDate() + 1);
      scheduledAt = d.toISOString();
    }

    await create({
      title: rec.title,
      category: rec.category,
      scheduled_at: scheduledAt,
      scheduledAt,
      priority: 2,
      frequency: 'once',
    });

    onReminderCreated?.();
    fetch();
  }, [create, fetch, onReminderCreated]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#7F77DD" />
        <Text style={styles.loadingText}>Analyse de tes habitudes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetch} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (!data?.recommendations?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💡 Suggestions pour toi</Text>
        </View>
        <Text style={styles.emptyText}>
          Crée et complète des rappels pour recevoir des suggestions personnalisées.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💡 Suggestions pour toi</Text>
          <Text style={styles.subtitle}>Basé sur tes habitudes · s'améliore avec le temps</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={fetch}>
          <Text style={styles.refreshIcon}>↻</Text>
        </Pressable>
      </View>

      {data.recommendations.map((rec, i) => (
        <RecoCard
          key={i}
          rec={rec}
          onCreateReminder={handleCreateReminder}
          onFeedback={(action) => aiAPI.postFeedback({ category: rec.category, action })}
        />
      ))}

      {data.patterns && (
        <Text style={styles.footer}>
          Basé sur {data.patterns.totalReminders} rappel{data.patterns.totalReminders > 1 ? 's' : ''} · {data.patterns.completionRate} % complétés
        </Text>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  subtitle: { fontSize: 12, color: '#aaa', marginTop: 2 },
  refreshBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 14, color: '#7F77DD', fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f8fc', borderRadius: 14, padding: 12,
    marginBottom: 8, gap: 10,
  },
  cardDismissed: {
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, minHeight: 44, opacity: 0.5,
  },
  dismissedText: { fontSize: 12, color: '#aaa', fontStyle: 'italic' },
  cardLeft: { width: 32, alignItems: 'center' },
  cardIcon: { fontSize: 22 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  cardReason: { fontSize: 12, color: '#888', marginTop: 2, fontStyle: 'italic' },
  cardTime: { fontSize: 11, color: '#7F77DD', marginTop: 4 },
  feedbackRow: { flexDirection: 'row', marginTop: 6 },
  dislikeBtn: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f0f0f0' },
  dislikeBtnText: { fontSize: 11, color: '#888' },
  cardRight: { alignItems: 'center', gap: 6 },
  confidence: { fontSize: 12, fontWeight: '700' },
  createBtn: {
    backgroundColor: '#7F77DD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  footer: { marginTop: 8, fontSize: 11, color: '#ccc', textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20, paddingVertical: 8 },
});
