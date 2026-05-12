import { useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRemindersStore } from '../../src/store/reminders.store';
import DailySummary from '../../src/components/DailySummary';
import BudgetWidget from '../../src/components/BudgetWidget';
import RecommendationsWidget from '../../src/components/RecommendationsWidget';
import PatternsStats from '../../src/components/PatternsStats';

export default function DashboardScreen() {
  const { load, isLoading } = useRemindersStore();
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#7F77DD" />}
    >
      <Text style={styles.pageTitle}>Dashboard</Text>
      <DailySummary />
      <RecommendationsWidget onReminderCreated={load} />
      <BudgetWidget category="errand" period="monthly" />
      <PatternsStats />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fafafa' },
  content: { paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, marginBottom: 8 },
  bottomSpacer: { height: 20 },
});
