import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { analyticsAPI } from '../../src/api/analytics';
import { aiAPI } from '../../src/api/ai';
import KPICard from '../../src/components/analytics/KPICard';
import CompletionChart from '../../src/components/analytics/CompletionChart';
import HourlyChart from '../../src/components/analytics/HourlyChart';
import CategoryBreakdown from '../../src/components/analytics/CategoryBreakdown';
import InsightsCard from '../../src/components/analytics/InsightsCard';
import RemHabitsCard from '../../src/components/analytics/RemHabitsCard';

const PURPLE = '#7F77DD';
const PERIODS = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChartCard({ title, children }) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState('week');
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [insights, setInsights] = useState([]);
  const [habits, setHabits] = useState(null);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async (p = period) => {
    setLoading(true);
    try {
      const [sum, ch, ins] = await Promise.all([
        analyticsAPI.getSummary(p),
        analyticsAPI.getCharts(p),
        analyticsAPI.getInsights(p),
      ]);
      setSummary(sum);
      setCharts(ch);
      setInsights(ins.insights || []);
    } catch (err) {
      console.warn('[analytics] load error', err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(period); }, [period]);

  useEffect(() => {
    setHabitsLoading(true);
    aiAPI.getHabits()
      .then((h) => setHabits(h))
      .catch(() => {})
      .finally(() => setHabitsLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { report } = await analyticsAPI.exportText(period);
      await Share.share({ message: report });
    } catch {
      Alert.alert('Export', 'Impossible de générer le rapport. Réessayez.');
    } finally {
      setExporting(false);
    }
  };

  const trendLabel = (v) => {
    if (v == null) return null;
    if (v > 0) return `+${v}%`;
    if (v < 0) return `${v}%`;
    return '=';
  };
  const trendColor = (v) => (v > 0 ? '#4CAF82' : v < 0 ? '#E8735A' : '#888');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.7 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator size="small" color={PURPLE} />
            : <Ionicons name="share-outline" size={20} color={PURPLE} />
          }
        </Pressable>
      </View>

      {/* Period tabs */}
      <View style={styles.tabs}>
        {PERIODS.map(p => (
          <Pressable
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Calcul de tes stats…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── KPI Cards ── */}
          <Section title="Vue d'ensemble">
            <View style={styles.kpiRow}>
              <KPICard
                emoji="✅"
                label="Complétés"
                value={summary?.completed ?? 0}
                bg="#F0F4FF"
              />
              <KPICard
                emoji="🎯"
                label="Taux"
                value={`${summary?.rate ?? 0}%`}
                bg="#EDFFF5"
              />
            </View>
            <View style={[styles.kpiRow, { marginTop: 10 }]}>
              <KPICard
                emoji="📈"
                label="vs période préc."
                value={trendLabel(summary?.trend) ?? '—'}
                subColor={trendColor(summary?.trend)}
                bg="#FFF8EE"
              />
              <KPICard
                emoji="🔥"
                label="Série"
                value={summary?.streak ?? 0}
                sub={summary?.streak > 0 ? `${summary.streak} jour${summary.streak > 1 ? 's' : ''}` : null}
                bg="#FFF0EE"
              />
            </View>
          </Section>

          {/* Score */}
          {charts?.productivityScore != null && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreLabel}>Score de productivité</Text>
                <Text style={styles.scoreDesc}>Basé sur ton taux de complétion et ta régularité</Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={[
                  styles.scoreValue,
                  { color: charts.productivityScore >= 70 ? '#4CAF82' : charts.productivityScore >= 40 ? PURPLE : '#E8735A' },
                ]}>
                  {charts.productivityScore}
                </Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>
          )}

          {/* ── Completion chart ── */}
          <ChartCard title="📊 Complétion par jour">
            <CompletionChart
              data={charts?.completionByDay || []}
              period={period}
              color={PURPLE}
            />
          </ChartCard>

          {/* ── Hourly chart ── */}
          <ChartCard title="🕐 Activité par heure">
            <HourlyChart
              data={charts?.completionByHour || []}
              color={PURPLE}
            />
          </ChartCard>

          {/* ── Category breakdown ── */}
          <ChartCard title="📂 Répartition par catégorie">
            <CategoryBreakdown data={charts?.categoryBreakdown || []} />
          </ChartCard>

          {/* ── AI Insights ── */}
          {insights.length > 0 && (
            <Section title="🤖 Insights IA">
              <InsightsCard insights={insights} />
            </Section>
          )}

          {/* ── Rem habit analysis ── */}
          {(habitsLoading || habits) && (
            <Section title="🧠 Rem analyse tes habitudes">
              <RemHabitsCard habits={habits} loading={habitsLoading} />
            </Section>
          )}

          {/* Export */}
          <Pressable
            style={({ pressed }) => [styles.exportFull, pressed && { opacity: 0.8 }]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Ionicons name="share-social-outline" size={18} color={PURPLE} />
            <Text style={styles.exportFullText}>
              {exporting ? 'Génération…' : 'Partager le rapport'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8fc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
  exportBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#eeecff',
    alignItems: 'center', justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#ededf5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#1a1a2e', fontWeight: '700' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#aaa', fontSize: 14 },

  scroll: { paddingHorizontal: 20, gap: 16 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },

  kpiRow: { flexDirection: 'row', gap: 10 },

  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreLeft: { flex: 1, marginRight: 12 },
  scoreLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  scoreDesc: { fontSize: 12, color: '#999', lineHeight: 16 },
  scoreCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#f5f5ff',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreValue: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  scoreMax: { fontSize: 10, color: '#bbb', fontWeight: '600' },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },

  exportFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0f0',
    backgroundColor: '#fff',
    marginTop: 4,
  },
  exportFullText: { fontSize: 15, color: PURPLE, fontWeight: '700' },
});
