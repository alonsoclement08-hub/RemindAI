import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { budgetAPI } from '../api/budget';
import BudgetSettings from './BudgetSettings';

const CATEGORY_LABELS = {
  errand: '🛒 Courses', health: '💊 Santé', work: '💼 Travail',
  personal: '👤 Personnel', habit: '🔄 Habitudes', call: '📞 Appels',
};

const PERIOD_LABELS = { weekly: 'cette semaine', monthly: 'ce mois', yearly: 'cette année' };

function ProgressBar({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct ?? 0));
  const color = clamped >= 90 ? '#E0654A' : clamped >= 80 ? '#FFB800' : '#1D9E75';
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function BudgetWidget({ category = 'errand', period = 'monthly' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const usage = await budgetAPI.getUsage(category, period);
      setData(usage);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [category, period]);

  useEffect(() => { fetch(); }, [fetch]);

  const catLabel = CATEGORY_LABELS[category] || category;
  const periodLabel = PERIOD_LABELS[period] || period;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#7F77DD" />
      </View>
    );
  }

  const hasBudget = data?.hasBudget;
  const pct = data?.usagePct ?? 0;
  const alertColor = pct >= 90 ? '#E0654A' : pct >= 80 ? '#FFB800' : '#1D9E75';

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💳 Budget {catLabel}</Text>
          <Pressable style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsBtnText}>⚙</Text>
          </Pressable>
        </View>

        <Text style={styles.periodLabel}>{periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}</Text>

        {hasBudget ? (
          <>
            {/* Spent / limit */}
            <View style={styles.amountRow}>
              <Text style={styles.spent}>
                Dépensé : <Text style={styles.spentValue}>{data.estimatedSpent.toFixed(2)} €</Text>
              </Text>
              <Text style={styles.limit}>/ {data.budgetLimit.toFixed(0)} €</Text>
            </View>

            {/* Progress bar */}
            <ProgressBar pct={pct} />

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: alertColor }]}>{pct} %</Text>
                <Text style={styles.statLabel}>utilisé</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: (data.remaining ?? 0) >= 0 ? '#1D9E75' : '#E0654A' }]}>
                  {(data.remaining ?? 0).toFixed(2)} €
                </Text>
                <Text style={styles.statLabel}>restant</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.purchaseCount}</Text>
                <Text style={styles.statLabel}>achats</Text>
              </View>
            </View>

            {/* Alert banner */}
            {data.alertTriggered && (
              <View style={styles.alertBanner}>
                <Text style={styles.alertText}>
                  ⚠️ Budget atteint à {pct} % — pense à surveiller tes dépenses !
                </Text>
              </View>
            )}

            {data.pricedCount < data.purchaseCount && data.purchaseCount > 0 && (
              <Text style={styles.estimateNote}>
                * Montant estimé sur {data.pricedCount}/{data.purchaseCount} achats avec prix connus
              </Text>
            )}
          </>
        ) : (
          <View style={styles.noBudget}>
            <Text style={styles.noBudgetText}>Pas de budget défini {periodLabel}.</Text>
            <Pressable style={styles.setBtn} onPress={() => setShowSettings(true)}>
              <Text style={styles.setBtnText}>Définir un budget →</Text>
            </Pressable>
          </View>
        )}
      </View>

      <BudgetSettings
        visible={showSettings}
        initialCategory={category}
        initialPeriod={period}
        initialLimit={data?.budgetLimit ?? 100}
        initialThreshold={data?.alertThreshold ?? 0.8}
        onClose={() => setShowSettings(false)}
        onSaved={() => { setShowSettings(false); fetch(); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  settingsBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  settingsBtnText: { fontSize: 14, color: '#555' },
  periodLabel: { fontSize: 12, color: '#999', marginBottom: 14 },

  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10, gap: 4 },
  spent: { fontSize: 14, color: '#555' },
  spentValue: { fontWeight: '700', color: '#1a1a2e' },
  limit: { fontSize: 13, color: '#aaa' },

  barTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 14, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  statsRow: { flexDirection: 'row', gap: 0 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },

  alertBanner: {
    marginTop: 12, backgroundColor: '#FFF5F0',
    borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#E0654A',
  },
  alertText: { fontSize: 13, color: '#E0654A', fontWeight: '600' },

  estimateNote: { marginTop: 8, fontSize: 10, color: '#bbb', fontStyle: 'italic', textAlign: 'center' },

  noBudget: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  noBudgetText: { fontSize: 13, color: '#aaa' },
  setBtn: { backgroundColor: '#7F77DD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  setBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
