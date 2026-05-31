import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { integrationsAPI } from '../../src/api/integrations';

const PURPLE = '#7F77DD';

// ─── Service definitions ───────────────────────────────────────────────────────

const SERVICES = [
  {
    key: 'google',
    name: 'Google Calendar',
    icon: '📅',
    iconBg: '#EEF8FF',
    description: 'Ajoute tes rappels directement dans Google Calendar.',
    authKey: 'getGoogleAuthUrl',
    features: ['Sync automatique', 'Événements avec rappels', 'Partage de calendrier'],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    iconBg: '#EDFFF5',
    description: 'Lance une playlist quand tu complètes un rappel sport, travail ou habitude.',
    authKey: 'getSpotifyAuthUrl',
    features: ['Playlist par catégorie', 'Ouvre Spotify automatiquement', 'Sport, Focus, Chill…'],
  },
  {
    key: 'notion',
    name: 'Notion',
    icon: '📝',
    iconBg: '#F5F5F5',
    description: 'Exporte tes rappels complétés dans une base Notion.',
    authKey: 'getNotionAuthUrl',
    features: ['Export automatique', 'Historique complet', 'Base de données structurée'],
    extraAction: { label: 'Exporter maintenant', handler: 'syncNotion' },
  },
  {
    key: 'health',
    name: 'Apple Health',
    icon: '❤️',
    iconBg: '#FFF0F0',
    description: 'Enregistre tes activités sport et santé dans Apple Health.',
    iosOnly: true,
    comingSoon: true,
    features: ['Workouts automatiques', 'Calories estimées', 'Connexion HealthKit'],
  },
];

// ─── IntegrationCard ──────────────────────────────────────────────────────────

function IntegrationCard({ service, status, onConnect, onDisconnect, onAction, connecting }) {
  const connected = status?.connected;
  const accountLabel = status?.email || null;

  if (service.comingSoon) {
    return (
      <View style={[styles.card, styles.cardDim]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: service.iconBg }]}>
            <Text style={styles.iconText}>{service.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameLine}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.iosOnly && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>iOS</Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceDesc}>{service.description}</Text>
          </View>
          <View style={[styles.statusBadge, styles.statusSoon]}>
            <Text style={[styles.statusText, { color: '#aaa' }]}>Bientôt</Text>
          </View>
        </View>
        <View style={styles.featuresRow}>
          {service.features.map((f, i) => (
            <View key={i} style={styles.featureChip}>
              <Text style={styles.featureChipText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, connected && styles.cardConnected]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: service.iconBg }]}>
          <Text style={styles.iconText}>{service.icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.serviceName}>{service.name}</Text>
          </View>
          {connected && accountLabel ? (
            <Text style={styles.accountLabel} numberOfLines={1}>{accountLabel}</Text>
          ) : (
            <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, connected ? styles.statusOn : styles.statusOff]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF82' : '#ddd' }]} />
          <Text style={[styles.statusText, { color: connected ? '#4CAF82' : '#aaa' }]}>
            {connected ? 'Connecté' : 'Inactif'}
          </Text>
        </View>
      </View>

      {/* Features */}
      {!connected && (
        <View style={styles.featuresRow}>
          {service.features.map((f, i) => (
            <View key={i} style={styles.featureChip}>
              <Text style={styles.featureChipText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {connected ? (
          <>
            {service.extraAction && (
              <Pressable
                style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
                onPress={() => onAction(service.extraAction.handler)}
              >
                <Ionicons name="sync-outline" size={15} color={PURPLE} />
                <Text style={styles.btnSecondaryText}>{service.extraAction.label}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.btnDanger, pressed && { opacity: 0.7 }]}
              onPress={() => onDisconnect(service.key)}
            >
              <Text style={styles.btnDangerText}>Déconnecter</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }, connecting === service.key && styles.btnDisabled]}
            onPress={() => onConnect(service)}
            disabled={connecting === service.key}
          >
            {connecting === service.key
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="link-outline" size={16} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Connecter</Text>
                </>
            }
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── WeatherCard (always active) ──────────────────────────────────────────────

function WeatherCard() {
  return (
    <View style={[styles.card, styles.cardConnected]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: '#FFF8EE' }]}>
          <Text style={styles.iconText}>🌤️</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.serviceName}>Météo</Text>
          <Text style={styles.serviceDesc}>Conseils IA adaptés à la météo actuelle dans le résumé du jour.</Text>
        </View>
        <View style={[styles.statusBadge, styles.statusOn]}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF82' }]} />
          <Text style={[styles.statusText, { color: '#4CAF82' }]}>Actif</Text>
        </View>
      </View>
      <View style={styles.featuresRow}>
        {['Sans compte', 'Open-Meteo API', 'Intégré au résumé'].map((f, i) => (
          <View key={i} style={styles.featureChip}>
            <Text style={styles.featureChipText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function IntegrationsScreen() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const insets = useSafeAreaInsets();

  const loadStatus = async () => {
    try {
      const s = await integrationsAPI.getStatus();
      setStatus(s || {});
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadStatus(); }, []));

  // Handle deep link return from OAuth
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('integrations')) {
        setTimeout(loadStatus, 800);
      }
    });
    return () => sub.remove();
  }, []);

  const handleConnect = async (service) => {
    setConnecting(service.key);
    try {
      const getUrl = integrationsAPI[service.authKey];
      if (!getUrl) throw new Error('Auth method not found');
      const url = await getUrl();
      await Linking.openURL(url);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      Alert.alert(
        `Connexion ${service.name}`,
        msg.includes('non configuré')
          ? `${service.name} n'est pas encore configuré sur ce serveur.\n\n${msg}`
          : `Impossible d'ouvrir la page de connexion.\n\n${msg}`,
      );
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = (serviceKey) => {
    Alert.alert(
      'Déconnecter',
      `Déconnecter ${serviceKey} de RemindAI ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await integrationsAPI.disconnect(serviceKey);
              setStatus(s => ({ ...s, [serviceKey]: { connected: false } }));
            } catch {
              Alert.alert('Erreur', 'Impossible de déconnecter. Réessayez.');
            }
          },
        },
      ]
    );
  };

  const handleAction = async (handler) => {
    if (handler === 'syncNotion') {
      try {
        const result = await integrationsAPI.syncToNotion();
        Alert.alert('Notion', `${result.synced} rappel${result.synced > 1 ? 's' : ''} exporté${result.synced > 1 ? 's' : ''} avec succès !`);
        loadStatus();
      } catch (err) {
        Alert.alert('Erreur Notion', err.response?.data?.error || 'Sync échoué.');
      }
    }
  };

  const connectedCount = Object.values(status).filter(s => s?.connected).length + 1; // +1 for weather

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Intégrations</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{connectedCount} actif{connectedCount > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <Text style={styles.headerSub}>
        Connecte tes applications préférées pour enrichir ton expérience RemindAI.
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Weather — always active */}
          <WeatherCard />

          {/* OAuth services */}
          {SERVICES.map(service => (
            <IntegrationCard
              key={service.key}
              service={service}
              status={status[service.key]}
              connecting={connecting}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onAction={handleAction}
            />
          ))}

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={PURPLE} />
            <Text style={styles.infoText}>
              Tes tokens OAuth sont stockés de façon sécurisée et ne sont jamais partagés avec des tiers.
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', flex: 1, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#999', paddingHorizontal: 20, marginBottom: 16, lineHeight: 18 },
  countBadge: {
    backgroundColor: '#eeecff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  countText: { fontSize: 12, fontWeight: '700', color: PURPLE },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 12 },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardConnected: { borderColor: '#e0f0e8' },
  cardDim: { opacity: 0.65 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconText: { fontSize: 26 },

  cardInfo: { flex: 1, gap: 3 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  serviceDesc: { fontSize: 12, color: '#888', lineHeight: 17 },
  accountLabel: { fontSize: 12, color: '#4CAF82', fontWeight: '600' },

  badge: {
    backgroundColor: '#EEF0FF', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: PURPLE },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, flexShrink: 0,
  },
  statusOn:   { backgroundColor: '#EDFFF5' },
  statusOff:  { backgroundColor: '#f0f0f0' },
  statusSoon: { backgroundColor: '#f0f0f0' },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: {
    backgroundColor: '#f4f4f8', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  featureChipText: { fontSize: 11, color: '#666', fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: PURPLE, paddingVertical: 12, borderRadius: 12,
    shadowColor: PURPLE, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: PURPLE, backgroundColor: '#f4f4ff',
  },
  btnSecondaryText: { color: PURPLE, fontSize: 13, fontWeight: '600' },

  btnDanger: {
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0654A', backgroundColor: '#fff7f5',
  },
  btnDangerText: { color: '#E0654A', fontSize: 13, fontWeight: '600' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#f0f0ff', borderRadius: 12, padding: 14,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 17 },
});
