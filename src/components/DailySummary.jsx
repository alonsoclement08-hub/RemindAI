import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Location from 'expo-location';
import { useRemindersStore } from '../store/reminders.store';
import { aiAPI } from '../api/ai';
import { weatherAPI } from '../api/weather';

const PRIORITY_ICON = { urgent: '🔴', high: '🟠', normal: '📋' };

const TONE_COLORS = {
  encouraging: { bg: '#f4f3ff', border: '#7F77DD', text: '#5a53b8' },
  motivating:  { bg: '#f0fff8', border: '#1D9E75', text: '#157a5a' },
  advisory:    { bg: '#fffbf0', border: '#FFB800', text: '#b88000' },
  urgent:      { bg: '#fff4f0', border: '#E0654A', text: '#b84a32' },
};

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function generateReason(reminder) {
  if (reminder.priority >= 4) return 'Priorité urgente';
  if (reminder.priority === 3) return 'Priorité haute';
  if (reminder.frequency && reminder.frequency !== 'once') {
    const labels = { daily: 'quotidien', weekly: 'hebdomadaire', monthly: 'mensuel', custom: 'récurrent' };
    return `Rappel ${labels[reminder.frequency] || 'récurrent'}`;
  }
  if (reminder.scheduled_at) {
    const diffH = Math.round((new Date(reminder.scheduled_at) - new Date()) / 3600000);
    if (diffH <= 2) return 'Prévu dans moins de 2h';
    if (diffH <= 24) return 'Prévu aujourd\'hui';
  }
  return 'À ne pas oublier';
}

// Local fallback message when AI is offline
function buildLocalAdvice(urgentCount, todoCount, completedToday, pending) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir';
  if (urgentCount > 0) {
    return `${greeting} ! Tu as ${urgentCount} tâche${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''} aujourd'hui. Commence par "${pending[0]?.title}" pour prendre de l'élan 💪`;
  }
  if (todoCount === 0) return `${greeting} ! Tout est à jour — tu gères parfaitement 🎉`;
  return `${greeting} ! Tu as ${todoCount} rappel${todoCount > 1 ? 's' : ''} en attente. Bonne journée ! 🚀`;
}

export default function DailySummary() {
  const { reminders } = useRemindersStore();
  const [expanded, setExpanded] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  const [weather, setWeather] = useState(null);
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  // Fetch weather in background (best-effort, no error shown to user)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const w = await weatherAPI.getCurrent(loc.coords.latitude, loc.coords.longitude);
        setWeather(w);
      } catch {}
    })();
  }, []);

  // Pulse animation while loading
  useEffect(() => {
    if (!loadingAdvice) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loadingAdvice]);

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const dayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const active   = reminders.filter((r) => !r.deleted_at && !r.archived_at);
  const pending  = active.filter((r) => !r.completed_at);
  const urgent   = pending.filter((r) => r.priority >= 3);
  const completedToday = active.filter((r) => {
    if (!r.completed_at) return false;
    const d = new Date(r.completed_at);
    return d >= dayStart && d <= dayEnd;
  }).length;

  const todoCount   = pending.length;
  const urgentCount = urgent.length;

  const recommendations = [...pending]
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return ta - tb;
    })
    .slice(0, 3)
    .map((r) => ({
      action: r.title,
      priority: r.priority >= 4 ? 'urgent' : r.priority === 3 ? 'high' : 'normal',
      reason: generateReason(r),
    }));

  const localFallback = buildLocalAdvice(urgentCount, todoCount, completedToday, urgent);

  // Fetch AI advice on mount
  useEffect(() => {
    setLoadingAdvice(true);
    aiAPI.generateAdvice({ type: 'daily_summary' })
      .then((data) => { if (data?.message) setAiAdvice(data); })
      .finally(() => setLoadingAdvice(false));
  }, []);

  const toneStyle = TONE_COLORS[aiAdvice?.tone] || TONE_COLORS.encouraging;

  const motivationalText = completedToday > 0
    ? `${completedToday} complété${completedToday > 1 ? 's' : ''} aujourd'hui — continue ! 🎯`
    : todoCount === 0
      ? 'Aucun rappel pour l\'instant. Crée-en un ! ✨'
      : `${todoCount} rappel${todoCount > 1 ? 's' : ''} en attente`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Résumé du jour</Text>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
        </View>
        {weather && (
          <View style={styles.weatherChip}>
            <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
            <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
          </View>
        )}
      </View>

      {/* Weather advice bar */}
      {weather?.advice && (
        <View style={styles.weatherBar}>
          <Text style={styles.weatherBarText}>{weather.emoji} {weather.advice}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="⚠️" value={urgentCount}      label="Urgents"   color="#FFF0F0" />
        <StatCard icon="📋" value={todoCount}         label="À faire"   color="#F0EFFF" />
        <StatCard icon="✅" value={completedToday}    label="Complétés" color="#F0FFF8" />
      </View>

      {/* AI Bubble */}
      <View style={[styles.aiBubbleWrap, { borderColor: toneStyle.border, backgroundColor: toneStyle.bg }]}>
        <View style={[styles.aiAvatar, { backgroundColor: toneStyle.border }]}>
          <Text style={styles.aiAvatarText}>IA</Text>
        </View>
        <View style={styles.aiBubbleContent}>
          {loadingAdvice ? (
            <View style={styles.loadingRow}>
              <Animated.View style={[styles.loadingDot, { opacity: pulseAnim }]} />
              <Text style={[styles.loadingLabel, { color: toneStyle.text }]}>L'IA analyse ta journée…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.aiMessage, { color: '#333' }]}>
                {aiAdvice?.message || localFallback}
              </Text>
              {aiAdvice?.actionItems?.length > 0 && (
                <View style={styles.actionRow}>
                  {aiAdvice.actionItems.slice(0, 2).map((item, i) => (
                    <View key={i} style={[styles.actionChip, { borderColor: toneStyle.border }]}>
                      <Text style={[styles.actionChipText, { color: toneStyle.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!aiAdvice && (
                <Text style={styles.offlineNote}>💡 Hors ligne — conseil local</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Recommendations (expandable) */}
      {recommendations.length > 0 && (
        <View style={styles.recoWrap}>
          <Pressable style={styles.recoHeader} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.recoTitle}>Recommandations du jour</Text>
            <Text style={styles.recoChevron}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
          {expanded && recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <Text style={styles.recIcon}>{PRIORITY_ICON[rec.priority] || '📋'}</Text>
              <View style={styles.recContent}>
                <Text style={styles.recAction} numberOfLines={1}>{rec.action}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <Text style={styles.progressLabel}>{motivationalText}</Text>
        {(todoCount + completedToday) > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${Math.round((completedToday / (todoCount + completedToday)) * 100)}%`,
            }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#7F77DD', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  dateLabel: { fontSize: 13, color: '#999', marginTop: 2 },
  weatherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF8EE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FFE8C0',
  },
  weatherEmoji: { fontSize: 16 },
  weatherTemp: { fontSize: 13, fontWeight: '700', color: '#F09B30' },
  weatherBar: {
    backgroundColor: '#FFFBF0', borderRadius: 10, padding: 10,
    marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#F09B30',
  },
  weatherBarText: { fontSize: 13, color: '#666', lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 2 },

  aiBubbleWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, borderWidth: 1.5, padding: 12, marginBottom: 14,
  },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  aiBubbleContent: { flex: 1 },
  aiMessage: { fontSize: 14, lineHeight: 22, color: '#333' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  loadingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#7F77DD',
  },
  loadingLabel: { fontSize: 13, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  actionChip: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  actionChipText: { fontSize: 12, fontWeight: '600' },
  offlineNote: { fontSize: 11, color: '#bbb', marginTop: 6, fontStyle: 'italic' },

  recoWrap: { backgroundColor: '#f9f9fc', borderRadius: 12, padding: 12, marginBottom: 14 },
  recoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recoTitle: { fontSize: 13, fontWeight: '700', color: '#555' },
  recoChevron: { fontSize: 12, color: '#aaa' },
  recRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  recIcon: { fontSize: 14 },
  recContent: { flex: 1 },
  recAction: { fontSize: 13, fontWeight: '600', color: '#222' },
  recReason: { fontSize: 11, color: '#999', marginTop: 1 },

  progressWrap: { gap: 8 },
  progressLabel: { fontSize: 12, color: '#999', fontWeight: '500' },
  progressTrack: { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#7F77DD', borderRadius: 3 },
});
