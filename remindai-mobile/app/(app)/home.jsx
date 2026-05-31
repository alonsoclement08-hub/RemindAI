import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemindersStore } from '../../src/store/reminders.store';
import ReminderCard from '../../src/components/ReminderCard';
import ReminderDetailModal from '../../src/components/ReminderDetailModal';
import ReminderForm from '../../src/components/ReminderForm';
import DailySummary from '../../src/components/DailySummary';
import { aiAPI } from '../../src/api/ai';
import { C, RADIUS, SP, SHADOW } from '../../src/theme';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function HomeScreen() {
  const { reminders, isLoading, load, sync, complete, snooze, remove, getTimeSections } = useRemindersStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const sections = getTimeSections();

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const dateStr = format(now, 'd MMMM', { locale: fr });

  const handleComplete = useCallback((id) => {
    const reminder = reminders.find((r) => r.id === id);
    complete(id);
    if (reminder?.category) {
      aiAPI.postFeedback({ reminderId: id, category: reminder.category, action: 'completed' });
    }
  }, [reminders, complete]);

  const handleSnooze = useCallback((id, mins) => {
    const reminder = reminders.find((r) => r.id === id);
    snooze(id, mins);
    if (reminder?.category) {
      aiAPI.postFeedback({ reminderId: id, category: reminder.category, action: 'snoozed' });
    }
  }, [reminders, snooze]);

  useFocusEffect(useCallback(() => { load(); }, []));

  const counts = {
    overdue:  sections.overdue.length,
    today:    sections.today.length,
    tomorrow: sections.tomorrow.length,
    later:    sections.later.length,
  };

  const visible = (key) => activeFilter === null || activeFilter === key;

  const totalActive = reminders.filter((r) => !r.completed_at && !r.deleted_at).length;
  const completedCount = reminders.filter((r) => r.completed_at).length;
  const urgentCount = sections.overdue.length + reminders.filter(r => !r.completed_at && r.priority >= 4).length;
  const progressPct = reminders.length > 0
    ? Math.round((completedCount / reminders.length) * 100)
    : 0;

  if (isLoading && reminders.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.violet} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.dateRow}>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.dateText}> · {dateStr}</Text>
          </Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push('/(app)/settings')}
        >
          <Text style={styles.avatarText}>R</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={sync} tintColor={C.violet} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* ── HERO card ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroBadgeText}>RÉSUMÉ DU JOUR</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            {urgentCount > 0
              ? `Tu as ${urgentCount} chose${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''}. Consulte tes priorités.`
              : totalActive > 0
                ? `${totalActive} rappel${totalActive > 1 ? 's' : ''} en cours. Tu gères bien.`
                : 'Aucun rappel en attente. Profite de ta journée.'}
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{urgentCount}</Text>
              <Text style={styles.heroStatLabel}>Urgents</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalActive}</Text>
              <Text style={styles.heroStatLabel}>À faire</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{progressPct}%</Text>
              <Text style={styles.heroStatLabel}>Avancé</Text>
            </View>
          </View>
        </View>

        {/* ── AI suggestion strip ── */}
        {!suggestionDismissed && totalActive > 0 && (
          <View style={styles.aiSuggestion}>
            <View style={[styles.aiSuggIcon, { backgroundColor: C.violetSoft }]}>
              <Text style={{ color: C.violet, fontSize: 12 }}>✦</Text>
            </View>
            <View style={styles.aiSuggBody}>
              <Text style={styles.aiSuggLabel}>Suggestion IA</Text>
              <Text style={styles.aiSuggText} numberOfLines={2}>
                Revue ta liste avant midi — {sections.today.length} rappels aujourd'hui.
              </Text>
            </View>
            <Pressable style={styles.aiSuggClose} onPress={() => setSuggestionDismissed(true)}>
              <Text style={{ color: C.text4, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
        )}

        <DailySummary />

        {/* ── Empty state ── */}
        {reminders.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark}>
              <Text style={{ fontSize: 28, color: C.teal }}>✓</Text>
            </View>
            <Text style={styles.emptyTitle}>Journée libre !</Text>
            <Text style={styles.emptySub}>Appuie sur + pour créer ton premier rappel</Text>
          </View>
        )}

        {/* ── Overdue ── */}
        {visible('overdue') && sections.overdue.length > 0 && (
          <Section
            title="En retard"
            count={sections.overdue.length}
            accentColor={C.urgent}
            reminders={sections.overdue}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onSelect={setSelectedReminder}
          />
        )}

        {/* ── Today ── */}
        {visible('today') && sections.today.length > 0 && (
          <Section
            title="Aujourd'hui"
            count={sections.today.length}
            reminders={sections.today}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onSelect={setSelectedReminder}
          />
        )}

        {/* ── Tomorrow ── */}
        {visible('tomorrow') && sections.tomorrow.length > 0 && (
          <Section
            title="Demain"
            count={sections.tomorrow.length}
            reminders={sections.tomorrow}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onSelect={setSelectedReminder}
          />
        )}

        {/* ── Later ── */}
        {visible('later') && sections.later.length > 0 && (
          <Section
            title="Plus tard"
            count={sections.later.length}
            reminders={sections.later}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onSelect={setSelectedReminder}
          />
        )}

        {/* Tomorrow preview strip */}
        {sections.tomorrow.length > 0 && activeFilter === null && (
          <View style={styles.tomorrowPreview}>
            <Text style={{ fontSize: 16, marginRight: SP.sm }}>📅</Text>
            <Text style={styles.tomorrowText}>
              <Text style={{ fontWeight: '700', color: C.text }}>{sections.tomorrow.length} rappel{sections.tomorrow.length > 1 ? 's' : ''}</Text>
              {' '}programmés demain
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <ReminderDetailModal
        reminder={selectedReminder}
        visible={!!selectedReminder}
        onClose={() => setSelectedReminder(null)}
        onComplete={() => { handleComplete(selectedReminder.id); setSelectedReminder(null); }}
        onSnooze={(mins) => { handleSnooze(selectedReminder.id, mins); setSelectedReminder(null); }}
        onEdit={() => { setEditingReminder(selectedReminder); setSelectedReminder(null); }}
        onDelete={() => { remove(selectedReminder.id); setSelectedReminder(null); }}
      />

      <ReminderForm
        visible={!!editingReminder}
        reminder={editingReminder}
        onClose={() => setEditingReminder(null)}
        onSaved={() => { load(); setEditingReminder(null); }}
      />

      {/* ── FAB ── */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + SP.xl }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] }]}
          onPress={() => router.push('/(app)/create')}
          testID="add-button"
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, count, accentColor, reminders, onComplete, onSnooze, onSelect }) {
  if (!reminders.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, accentColor && { color: accentColor }]}>
          {title}
        </Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {reminders.map((r) => (
        <ReminderCard
          key={r.id}
          reminder={r}
          onComplete={() => onComplete(r.id)}
          onSnooze={(mins) => onSnooze(r.id, mins)}
          onPress={() => onSelect(r)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SP.xl, paddingVertical: SP.lg,
    backgroundColor: C.bg,
  },
  headerLeft: {},
  greeting: { fontSize: 13, fontWeight: '600', color: C.text3, letterSpacing: 0.5, textTransform: 'uppercase' },
  dateRow: {},
  dayName: { fontSize: 22, fontWeight: '800', color: C.violet, letterSpacing: -0.4 },
  dateText: { fontSize: 22, fontWeight: '600', color: C.text },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Hero card */
  hero: {
    marginHorizontal: SP.xl, marginBottom: SP.md,
    backgroundColor: C.violetDeep, borderRadius: 20,
    padding: SP.xl, overflow: 'hidden',
    ...SHADOW.md(C.violet),
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.md },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  pulseDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4CDDB5',
  },
  heroBadgeText: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  heroText: {
    fontSize: 15, color: '#fff', fontWeight: '500',
    lineHeight: 21, marginBottom: SP.xl, opacity: 0.9,
  },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.18)' },

  /* AI suggestion */
  aiSuggestion: {
    marginHorizontal: SP.xl, marginBottom: SP.md,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: SP.md, gap: SP.md,
    borderWidth: 1, borderColor: C.border,
    ...SHADOW.sm,
  },
  aiSuggIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  aiSuggBody: { flex: 1 },
  aiSuggLabel: { fontSize: 10, fontWeight: '700', color: C.violet, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  aiSuggText: { fontSize: 13, color: C.text2, lineHeight: 18 },
  aiSuggClose: { padding: SP.xs },

  /* Sections */
  section: { paddingHorizontal: SP.xl, marginBottom: SP.sm },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    marginBottom: SP.md, marginTop: SP.lg,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: C.text3,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12, fontWeight: '700', color: C.text4,
    backgroundColor: C.surface3, borderRadius: RADIUS.pill,
    paddingHorizontal: 7, paddingVertical: 1,
  },

  /* Empty state */
  emptyState: { alignItems: 'center', marginTop: 60, marginBottom: 20 },
  emptyMark: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.tealSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: SP.sm },
  emptySub: { fontSize: 14, color: C.text3, textAlign: 'center' },

  /* Tomorrow preview */
  tomorrowPreview: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SP.xl, marginTop: SP.lg,
    padding: SP.md, backgroundColor: C.surface2,
    borderRadius: RADIUS.md,
  },
  tomorrowText: { fontSize: 13, color: C.text3, lineHeight: 18 },

  /* FAB */
  fabWrap: { position: 'absolute', right: SP['2xl'] },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '300' },
});
