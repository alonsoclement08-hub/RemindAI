import { View, Text, Pressable, StyleSheet, Alert, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '../../src/store/auth.store';
import { useMicrosoftStore } from '../../src/store/microsoft.store';
import { useGoogleStore } from '../../src/store/google.store';
import { getMsAuthRequest, exchangeCodeForToken } from '../../src/services/microsoftGraph';
import { getGoogleAuthRequest, exchangeGoogleCode } from '../../src/services/googleWorkspace';
import { C } from '../../src/theme';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const ms = useMicrosoftStore();
  const google = useGoogleStore();
  const router = useRouter();
  const [quietHours, setQuietHours] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);
  const [msLoading, setMsLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const { redirectUri, request: authRequest, discovery } = getMsAuthRequest();
  const { redirectUri: gRedirectUri, request: gAuthRequest, discovery: gDiscovery } = getGoogleAuthRequest();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(authRequest, discovery);
  const [gRequest, gResponse, gPromptAsync] = AuthSession.useAuthRequest(gAuthRequest, gDiscovery);

  useEffect(() => { ms.checkConnection(); google.checkConnection(); }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      setMsLoading(true);
      exchangeCodeForToken(code, request.codeVerifier, redirectUri)
        .then(() => ms.checkConnection())
        .catch((e) => Alert.alert('Erreur', e.message))
        .finally(() => setMsLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Connexion annulée');
    }
  }, [response]);

  useEffect(() => {
    if (gResponse?.type === 'success') {
      const { code } = gResponse.params;
      setGLoading(true);
      exchangeGoogleCode(code, gRequest.codeVerifier, gRedirectUri)
        .then(() => google.checkConnection())
        .catch((e) => Alert.alert('Erreur Google', e.message))
        .finally(() => setGLoading(false));
    }
  }, [gResponse]);

  const connectMicrosoft = async () => {
    setMsLoading(true);
    try { await promptAsync(); } finally { setMsLoading(false); }
  };

  const connectGoogle = async () => {
    setGLoading(true);
    try { await gPromptAsync(); } finally { setGLoading(false); }
  };

  const disconnectGoogle = () => {
    Alert.alert('Déconnecter Google', 'Supprimer la connexion Google Workspace ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: google.disconnect },
    ]);
  };

  const disconnectMicrosoft = () => {
    Alert.alert('Déconnecter Microsoft', 'Supprimer la connexion Office 365 ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: ms.disconnect },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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

      {/* Microsoft Office 365 — masqué tant que le Client ID n'est pas configuré */}
      {!!process.env.EXPO_PUBLIC_MS_CLIENT_ID && process.env.EXPO_PUBLIC_MS_CLIENT_ID !== 'REMPLACE_PAR_TON_CLIENT_ID' && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Microsoft Office 365</Text>
        {ms.connected ? (
          <View>
            <View style={styles.msConnected}>
              <View style={styles.msLogo}>
                <Text style={styles.msLogoText}>M</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.msName}>{ms.profile?.displayName || 'Connecté'}</Text>
                <Text style={styles.msEmail}>{ms.profile?.mail || ms.profile?.userPrincipalName}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>✓ Connecté</Text>
              </View>
            </View>
            <View style={styles.msFeatures}>
              <Text style={styles.msFeatureItem}>📅 Réunions Teams & Outlook</Text>
              <Text style={styles.msFeatureItem}>📄 Documents Word & PowerPoint</Text>
              <Text style={styles.msFeatureItem}>👥 Contacts & collègues</Text>
            </View>
            <Pressable style={styles.msDisconnectBtn} onPress={disconnectMicrosoft}>
              <Text style={styles.msDisconnectText}>Déconnecter</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.msDesc}>
              Connecte ton compte Microsoft pour que l'IA trouve tes réunions, tes documents et tes collègues automatiquement.
            </Text>
            <Pressable
              style={[styles.msConnectBtn, (msLoading || !request) && { opacity: 0.6 }]}
              onPress={connectMicrosoft}
              disabled={msLoading || !request}
            >
              {msLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.msConnectLogo}>⊞</Text>
                  <Text style={styles.msConnectText}>Se connecter avec Microsoft</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      )}

      {/* Google Workspace */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Workspace</Text>
        {google.connected ? (
          <View>
            <View style={styles.msConnected}>
              <View style={[styles.msLogo, { backgroundColor: '#EA4335' }]}>
                <Text style={styles.msLogoText}>G</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.msName}>{google.profile?.name || 'Connecté'}</Text>
                <Text style={styles.msEmail}>{google.profile?.email}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>✓ Connecté</Text>
              </View>
            </View>
            <View style={styles.msFeatures}>
              <Text style={styles.msFeatureItem}>📅 Google Calendar</Text>
              <Text style={styles.msFeatureItem}>📄 Google Drive (Docs, Slides)</Text>
              <Text style={styles.msFeatureItem}>👥 Contacts Google</Text>
            </View>
            <Pressable style={styles.msDisconnectBtn} onPress={disconnectGoogle}>
              <Text style={styles.msDisconnectText}>Déconnecter</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.msDesc}>
              Connecte ton compte Google pour que l'IA trouve tes réunions Calendar, documents Drive et contacts automatiquement.
            </Text>
            <Pressable
              style={[styles.gConnectBtn, (gLoading || !gRequest) && { opacity: 0.6 }]}
              onPress={connectGoogle}
              disabled={gLoading || !gRequest}
            >
              {gLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.gConnectLogo}>G</Text>
                  <Text style={styles.gConnectText}>Se connecter avec Google</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Heures silencieuses (22h–8h)</Text>
          <Switch value={quietHours} onValueChange={setQuietHours} trackColor={{ true: C.brand }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Résumé quotidien (8h)</Text>
          <Switch value={dailySummary} onValueChange={setDailySummary} trackColor={{ true: C.brand }} />
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
          <Pressable style={styles.upgradeBtn} onPress={() => router.push('/(app)/paywall')}>
            <Text style={styles.upgradeBtnText}>✨ Passer à Pro — 4.99€/mois</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
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
  badgePro: { backgroundColor: C.brand },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  msDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 14, paddingTop: 8 },
  msConnectBtn: { backgroundColor: '#0078D4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 8 },
  msConnectLogo: { fontSize: 18, color: 'white' },
  msConnectText: { fontSize: 15, fontWeight: '700', color: 'white' },
  msConnected: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  msLogo: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#0078D4', alignItems: 'center', justifyContent: 'center' },
  msLogoText: { fontSize: 20, fontWeight: '800', color: 'white' },
  msName: { fontSize: 15, fontWeight: '600', color: '#222' },
  msEmail: { fontSize: 12, color: '#999', marginTop: 1 },
  connectedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  connectedBadgeText: { fontSize: 12, fontWeight: '700', color: '#34A853' },
  msFeatures: { paddingVertical: 10, gap: 6, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  msFeatureItem: { fontSize: 13, color: '#555' },
  msDisconnectBtn: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  msDisconnectText: { fontSize: 14, color: '#E0654A', fontWeight: '600' },
  gConnectBtn: { backgroundColor: '#EA4335', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 8 },
  gConnectLogo: { fontSize: 18, fontWeight: '800', color: 'white' },
  gConnectText: { fontSize: 15, fontWeight: '700', color: 'white' },

  upgradeBtn: { backgroundColor: C.brand, padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: { margin: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E0654A', alignItems: 'center' },
  logoutText: { color: '#E0654A', fontWeight: '600', fontSize: 15 },
  chevron: { fontSize: 20, color: '#bbb', fontWeight: '300' },
});
