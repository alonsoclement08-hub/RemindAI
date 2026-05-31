import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { aiAPI } from '../../src/api/ai';

const CATEGORY_LABELS = {
  work: 'Travail', personal: 'Personnel', health: 'Santé',
  errand: 'Courses', habit: 'Habitudes', call: 'Appels',
};
const CATEGORY_ICONS = {
  work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄', call: '📞',
};

function ScoreBar({ score }) {
  const clamped = Math.max(0, Math.min(1, (score + 0.2) / 1.2));
  const color = clamped >= 0.7 ? '#1D9E75' : clamped >= 0.4 ? '#FFB800' : '#E0654A';
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(clamped * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function PreferenceCard({ pref }) {
  const label = CATEGORY_LABELS[pref.category] || pref.category;
  const icon = CATEGORY_ICONS[pref.category] || '📌';
  const total = pref.timesCompleted + pref.timesIgnored;
  const pct = total > 0 ? Math.round((pref.timesCompleted / total) * 100) : 50;
  const scoreColor = pref.score >= 0.6 ? '#1D9E75' : pref.score >= 0.3 ? '#FFB800' : '#E0654A';

  return (
    <View style={styles.prefCard}>
      <View style={styles.prefHeader}>
        <Text style={styles.prefIcon}>{icon}</Text>
        <View style={styles.prefInfo}>
          <Text style={styles.prefLabel}>{label}</Text>
          <Text style={styles.prefStats}>{pref.timesCompleted} complétés · {pref.timesIgnored} ignorés</Text>
        </View>
        <Text style={[styles.prefScore, { color: scoreColor }]}>{pct}%</Text>
      </View>
      <ScoreBar score={pref.score} />
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learning, setLearning] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await aiAPI.getPreferences();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLearn = async () => {
    setLearning(true);
    try {
      const result = await aiAPI.learnPreferences();
      Alert.alert(
        'Apprentissage terminé',
        `${result.learned} préférence${result.learned > 1 ? 's' : ''} mise${result.learned > 1 ? 's' : ''} à jour.`
      );
      load();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'analyser les habitudes. Vérifie ta connexion.');
    } finally {
      setLearning(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'L\'IA oubliera tout ce qu\'elle a appris sur toi. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await aiAPI.resetPreferences();
              setData(null);
              Alert.alert('Fait', 'Les préférences ont été réinitialisées.');
            } catch {
              Alert.alert('Erreur', 'Impossible de réinitialiser.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (!data?.preferences?.length) return;
    const json = JSON.stringify(data.preferences, null, 2);
    await Share.share({ message: json, title: 'Mes préférences RemindAI' });
  };

  const preferences = data?.preferences || [];
  const patterns = data?.patterns || null;
  const goodPrefs = preferences.filter((p) => p.score >= 0.3);
  const badPrefs = preferences.filter((p) => p.score < 0.3);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backBtn}>← Retour</Text>
        </Pressable>
        <Text style={styles.pageTitle}>IA Personnalisée</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroBox}>
          <Text style={styles.heroIcon}>🧠</Text>
          <Text style={styles.heroTitle}>Ce que l'IA a appris</Text>
          <Text style={styles.heroSub}>
            L'IA analyse tes habitudes pour des suggestions de plus en plus précises.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#7F77DD" />
            <Text style={styles.loadingText}>Chargement des préférences…</Text>
          </View>
        ) : preferences.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Pas encore de données</Text>
            <Text style={styles.emptySub}>
              Crée et complète des rappels pour que l'IA apprenne tes habitudes.
            </Text>
            <Pressable
              style={[styles.learnBtn, learning && styles.learnBtnDisabled]}
              onPress={handleLearn}
              disabled={learning}
            >
              {learning
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.learnBtnText}>🔍 Analyser mes habitudes</Text>
              }
            </Pressable>
          </View>
        ) : (
          <>
            {patterns && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tes habitudes</Text>
                <View style={styles.patternGrid}>
                  {patterns.favoriteDay?.[0] && (
                    <View style={styles.patternCard}>
                      <Text style={styles.patternValue}>{patterns.favoriteDay[0]}</Text>
                      <Text style={styles.patternLabel}>Jour préféré</Text>
                    </View>
                  )}
                  {patterns.favoriteTime?.[0] && (
                    <View style={styles.patternCard}>
                      <Text style={styles.patternValue}>{patterns.favoriteTime[0]}</Text>
                      <Text style={styles.patternLabel}>Moment préféré</Text>
                    </View>
                  )}
                  {patterns.completionRate !== undefined && (
                    <View style={styles.patternCard}>
                      <Text style={styles.patternValue}>{patterns.completionRate}%</Text>
                      <Text style={styles.patternLabel}>Taux de complétion</Text>
                    </View>
                  )}
                  {patterns.totalReminders !== undefined && (
                    <View style={styles.patternCard}>
                      <Text style={styles.patternValue}>{patterns.totalReminders}</Text>
                      <Text style={styles.patternLabel}>Rappels analysés</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {goodPrefs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ce que tu aimes ✅</Text>
                {goodPrefs.map((p) => <PreferenceCard key={p.id} pref={p} />)}
              </View>
            )}

            {badPrefs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>À éviter ❌</Text>
                <Text style={styles.sectionSub}>Ces catégories ne te seront plus suggérées</Text>
                {badPrefs.map((p) => <PreferenceCard key={p.id} pref={p} />)}
              </View>
            )}

            <View style={styles.section}>
              <Pressable
                style={[styles.learnBtn, learning && styles.learnBtnDisabled]}
                onPress={handleLearn}
                disabled={learning}
              >
                {learning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.learnBtnText}>🔍 Réanalyser mes habitudes</Text>
                }
              </Pressable>
              <Pressable style={styles.exportBtn} onPress={handleExport}>
                <Text style={styles.exportBtnText}>📤 Exporter mes données</Text>
              </Pressable>
              <Pressable
                style={[styles.resetBtn, resetting && styles.resetBtnDisabled]}
                onPress={handleReset}
                disabled={resetting}
              >
                {resetting
                  ? <ActivityIndicator color="#E0654A" size="small" />
                  : <Text style={styles.resetBtnText}>🗑 Réinitialiser les préférences</Text>
                }
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { fontSize: 16, color: '#7F77DD', fontWeight: '600', width: 70 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  heroBox: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 20,
    padding: 24, marginBottom: 16,
    shadowColor: '#7F77DD', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  heroIcon: { fontSize: 40, marginBottom: 10 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  heroSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  centered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#999', fontSize: 14 },

  emptyBox: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 20,
    padding: 32, gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  sectionSub: { fontSize: 12, color: '#bbb', marginTop: -6, marginBottom: 10 },

  patternGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  patternCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  patternValue: { fontSize: 20, fontWeight: '800', color: '#7F77DD', marginBottom: 4 },
  patternLabel: { fontSize: 11, color: '#999', textAlign: 'center' },

  prefCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, gap: 10,
  },
  prefHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefIcon: { fontSize: 24 },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 15, fontWeight: '700', color: '#222' },
  prefStats: { fontSize: 11, color: '#aaa', marginTop: 2 },
  prefScore: { fontSize: 18, fontWeight: '800' },
  barTrack: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  learnBtn: {
    backgroundColor: '#7F77DD', borderRadius: 14, padding: 14,
    alignItems: 'center', marginBottom: 10, minHeight: 48, justifyContent: 'center',
  },
  learnBtnDisabled: { opacity: 0.6 },
  learnBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  exportBtn: {
    borderWidth: 1, borderColor: '#7F77DD', borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  exportBtnText: { color: '#7F77DD', fontWeight: '600', fontSize: 14 },
  resetBtn: {
    borderWidth: 1, borderColor: '#E0654A', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  resetBtnDisabled: { opacity: 0.5 },
  resetBtnText: { color: '#E0654A', fontWeight: '600', fontSize: 14 },
});
