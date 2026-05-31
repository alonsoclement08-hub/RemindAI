import { View, Text, Pressable, StyleSheet, Alert, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [quietHours, setQuietHours] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Réglages</Text>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{user.email}</Text>
            <View style={[styles.badge, user.tier === 'pro' && styles.badgePro]}>
              <Text style={styles.badgeText}>{user.tier === 'pro' ? 'PRO' : 'FREE'}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Heures silencieuses (22h–8h)</Text>
          <Switch value={quietHours} onValueChange={setQuietHours} trackColor={{ true: '#7F77DD' }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Résumé quotidien (8h)</Text>
          <Switch value={dailySummary} onValueChange={setDailySummary} trackColor={{ true: '#7F77DD' }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intelligence Artificielle</Text>
        <Pressable style={styles.row} onPress={() => router.push('/(app)/preferences')}>
          <Text style={styles.label}>🧠 Préférences apprises</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intégrations</Text>
        <Pressable style={styles.row} onPress={() => router.push('/(app)/integrations')}>
          <Text style={styles.label}>Calendriers et applications</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan</Text>
        {user?.tier !== 'pro' && (
          <Pressable style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>✨ Passer à Pro — 4.99€/mois</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout} testID="logout-button">
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: 60 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#222', padding: 20 },
  section: { backgroundColor: '#fff', marginBottom: 16, paddingHorizontal: 20, paddingVertical: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', paddingVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  label: { fontSize: 15, color: '#333', flex: 1 },
  badge: { backgroundColor: '#e0e0e0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePro: { backgroundColor: '#7F77DD' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  upgradeBtn: { backgroundColor: '#7F77DD', padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: { margin: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0654A', alignItems: 'center' },
  logoutText: { color: '#E0654A', fontWeight: '600', fontSize: 15 },
  chevron: { fontSize: 20, color: '#bbb', fontWeight: '300' },
});
