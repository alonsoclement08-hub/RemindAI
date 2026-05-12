import { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import ReminderCard from '../../src/components/ReminderCard';
import SummaryBar from '../../src/components/SummaryBar';

export default function HomeScreen() {
  const { reminders, isLoading, load, sync, complete, snooze, getTimeSections } = useRemindersStore();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(null);
  const sections = getTimeSections();

  useFocusEffect(useCallback(() => { load(); }, []));

  const counts = {
    overdue:  sections.overdue.length,
    today:    sections.today.length,
    tomorrow: sections.tomorrow.length,
    later:    sections.later.length,
  };

  const visible = (key) => activeFilter === null || activeFilter === key;

  const completedCount = reminders.filter((r) => r.completedAt).length;
  const completionRate = reminders.length > 0
    ? Math.round((completedCount / reminders.length) * 100)
    : 0;

  if (isLoading && reminders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7F77DD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes Rappels</Text>
          <Text style={styles.headerSub}>
            {sections.today.length} aujourd'hui · {completionRate}% complétés
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/(app)/create')}
          testID="add-button"
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Summary / filter bar */}
      <SummaryBar
        counts={counts}
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={sync} tintColor="#7F77DD" />}
      >
        {reminders.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Aucun rappel</Text>
            <Text style={styles.emptySub}>Appuie sur + pour créer ton premier rappel</Text>
          </View>
        )}

        {visible('overdue') && (
          <Section
            title="En retard ⚠️"
            reminders={sections.overdue}
            onComplete={complete}
            onSnooze={snooze}
            titleStyle={styles.overdueTitle}
          />
        )}
        {visible('today') && (
          <Section
            title="Aujourd'hui 🔥"
            reminders={sections.today}
            onComplete={complete}
            onSnooze={snooze}
          />
        )}
        {visible('tomorrow') && (
          <Section
            title="Demain"
            reminders={sections.tomorrow}
            onComplete={complete}
            onSnooze={snooze}
          />
        )}
        {visible('later') && (
          <Section
            title="Plus tard"
            reminders={sections.later}
            onComplete={complete}
            onSnooze={snooze}
          />
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, reminders, onComplete, onSnooze, titleStyle }) {
  if (!reminders.length) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>
      {reminders.map((r) => (
        <ReminderCard
          key={r.id}
          reminder={r}
          onComplete={() => onComplete(r.id)}
          onSnooze={(mins) => onSnooze(r.id, mins)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#7F77DD',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#666',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  overdueTitle: { color: '#E0654A' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
});
