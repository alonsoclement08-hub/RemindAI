import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import PriceComparison from '../../src/components/PriceComparison';
import { getAiHint } from '../../src/utils/aiHints';
import { getMeetingContext } from '../../src/services/microsoftGraph';
import { getWorkContext } from '../../src/services/googleWorkspace';
import { useMicrosoftStore } from '../../src/store/microsoft.store';
import { useGoogleStore } from '../../src/store/google.store';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { C } from '../../src/theme';


const CAT_META = {
  work: { label: 'Travail', icon: 'briefcase.fill' },
  health: { label: 'Santé', icon: 'heart.fill' },
  errand: { label: 'Courses', icon: 'cart.fill' },
  habit: { label: 'Habitude', icon: 'leaf.fill' },
  personal: { label: 'Personnel', icon: 'briefcase.fill' },
  call: { label: 'Appel', icon: 'phone.fill' },
};

function fmtTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const FREQ_LABEL = {
  daily: 'Tous les jours',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  custom: 'Personnalisé',
};

function fmtDate(isoStr) {
  if (!isoStr) return "Aujourd'hui";
  const d = new Date(isoStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const store = useRemindersStore();
  const r = store.reminders.find((x) => x.id === id);

  if (!r) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.navBar}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
            <SFIcon name="chevron.left" size={20} color={C.brand} weight="medium" />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: C.secondaryLabel }}>Rappel introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cat = CAT_META[r.category] || CAT_META.work;
  const isDone = !!r.completed_at;
  const time = fmtTime(r.scheduled_at);
  const date = fmtDate(r.scheduled_at);
  const isErrand = r.category === 'errand';

  const productQuery = encodeURIComponent(r.title);
  const mapsUrl = `https://www.google.com/maps/search/acheter+${productQuery}`;

  const [msContext, setMsContext] = useState(null);
  const [msLoading, setMsLoading] = useState(false);
  const ms = useMicrosoftStore();
  const googleWs = useGoogleStore();
  const isWork = r.category === 'work';

  useEffect(() => {
    if (!isWork) return;
    if (ms.connected) {
      setMsLoading(true);
      getMeetingContext(r.title).then(setMsContext).catch(() => {}).finally(() => setMsLoading(false));
    } else if (googleWs.connected) {
      setMsLoading(true);
      getWorkContext(r.title).then(setMsContext).catch(() => {}).finally(() => setMsLoading(false));
    }
  }, [r.id, ms.connected, googleWs.connected]);

  const handleToggle = () => {
    if (isDone) store.restore(r.id);
    else store.complete(r.id);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <SFIcon name="chevron.left" size={20} color={C.brand} weight="medium" />
          <Text style={styles.backText}>Aujourd'hui</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/(app)/edit', params: { id: r.id } })} hitSlop={10}>
          <Text style={styles.edit}>Modifier</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <SFIcon name={cat.icon} size={11} color={C.brand} />
            <Text style={styles.badgeText}>{cat.label}</Text>
          </View>
          <Text style={styles.title}>{r.title}</Text>
          <Text style={styles.when}>
            <Text style={styles.whenStrong}>{date} · {time}</Text>
          </Text>
          {!!r.description && <Text style={styles.desc}>{r.description}</Text>}
        </View>

        {/* AI context */}
        {!!r.context_ai && (
          <>
            <Text style={styles.sectionHeader}>CONTEXTE IA</Text>
            <View style={styles.card}>
              <View style={styles.aiContextRow}>
                <Text style={styles.aiLead}>L'IA a noté : </Text>
                <Text style={styles.aiText}>{r.context_ai}</Text>
              </View>
            </View>
          </>
        )}

        {/* AI hint */}
        <Text style={styles.sectionHeader}>CONSEIL IA</Text>
        <View style={[styles.card, styles.aiHintCard]}>
          <View style={styles.aiHintHeader}>
            <SFIcon name="sparkles" size={14} color={C.brand} />
            <Text style={styles.aiHintTitle}>RemindAI</Text>
          </View>
          <Text style={styles.aiHintText}>{getAiHint(r)}</Text>
        </View>

        {/* Microsoft Office context — work reminders */}
        {isWork && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>{googleWs.connected && !ms.connected ? 'GOOGLE WORKSPACE' : 'OFFICE 365'}</Text>
            {!ms.connected && !googleWs.connected && (
              <Pressable style={[styles.card, styles.msConnectCard]} onPress={() => router.push('/(app)/settings')}>
                <Text style={styles.msConnectIcon}>⊞</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.msConnectTitle}>Connecter Microsoft</Text>
                  <Text style={styles.msConnectSub}>Trouve tes réunions, collègues et documents automatiquement</Text>
                </View>
                <SFIcon name="chevron.right.small" size={14} color={C.tertiaryLabel} />
              </Pressable>
            )}
            {(ms.connected || googleWs.connected) && msLoading && (
              <View style={[styles.card, { padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#0078D4" />
                <Text style={styles.shopSub}>Recherche dans Office 365...</Text>
              </View>
            )}
            {(ms.connected || googleWs.connected) && !msLoading && msContext && (
              <View>
                {/* Upcoming meetings */}
                {msContext.events?.length > 0 && (
                  <View style={styles.card}>
                    {msContext.events.map((ev, i) => (
                      <Pressable
                        key={i}
                        style={[styles.msRow, i > 0 && styles.shopBorder]}
                        onPress={() => ev.onlineMeeting?.joinUrl && Linking.openURL(ev.onlineMeeting.joinUrl)}
                      >
                        <View style={[styles.shopIcon, { backgroundColor: '#0078D4' }]}>
                          <SFIcon name="video.fill" size={13} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.msItemTitle} numberOfLines={1}>{ev.subject}</Text>
                          <Text style={styles.msItemSub}>
                            {new Date(ev.start.dateTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' · '}
                            {new Date(ev.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {ev.attendees?.length > 0 && ` · ${ev.attendees.length} participants`}
                          </Text>
                        </View>
                        {ev.onlineMeeting?.joinUrl && (
                          <View style={styles.teamsBtn}>
                            <Text style={styles.teamsBtnText}>Rejoindre</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* People */}
                {msContext.people?.length > 0 && (
                  <View style={[styles.card, { marginTop: 8 }]}>
                    {msContext.people.map((p, i) => (
                      <Pressable
                        key={i}
                        style={[styles.msRow, i > 0 && styles.shopBorder]}
                        onPress={() => p.emailAddresses?.[0]?.address && Linking.openURL(`mailto:${p.emailAddresses[0].address}`)}
                      >
                        <View style={styles.personAvatar}>
                          <Text style={styles.personAvatarText}>{p.displayName?.[0] || '?'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.msItemTitle}>{p.displayName}</Text>
                          <Text style={styles.msItemSub}>{p.jobTitle || p.department || p.emailAddresses?.[0]?.address}</Text>
                        </View>
                        <SFIcon name="envelope" size={14} color={C.secondaryLabel} />
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Documents */}
                {msContext.files?.length > 0 && (
                  <View style={[styles.card, { marginTop: 8 }]}>
                    {msContext.files.slice(0, 4).map((f, i) => {
                      const isPpt = f.name?.match(/\.(pptx?|ppt)$/i);
                      const isDoc = f.name?.match(/\.(docx?|doc)$/i);
                      const icon = isPpt ? '📊' : isDoc ? '📝' : '📄';
                      return (
                        <Pressable
                          key={i}
                          style={[styles.msRow, i > 0 && styles.shopBorder]}
                          onPress={() => Linking.openURL(f.webUrl)}
                        >
                          <Text style={{ fontSize: 24 }}>{icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.msItemTitle} numberOfLines={1}>{f.name}</Text>
                            <Text style={styles.msItemSub}>
                              Modifié {new Date(f.lastModifiedDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                          <SFIcon name="arrow.up.right" size={13} color={C.secondaryLabel} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* No results */}
                {!msContext.events?.length && !msContext.people?.length && !msContext.files?.length && (
                  <View style={[styles.card, { padding: 16 }]}>
                    <Text style={styles.shopSub}>Aucun élément Office trouvé pour ce rappel.</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Info rows */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>DÉTAILS</Text>
        <View style={styles.card}>
          <InfoRow icon="clock" title="Heure" subtitle={time || 'Non définie'} />
          <InfoRow icon="calendar" title="Date" subtitle={date} />
          {!!r.frequency && r.frequency !== 'once' && (
            <InfoRow icon="arrow.clockwise" title="Récurrence" subtitle={FREQ_LABEL[r.frequency] || r.frequency} />
          )}
        </View>

        {/* Shopping — only for errand reminders */}
        {isErrand && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>OÙ ACHETER</Text>

            <PriceComparison productName={r.title} style={{ marginHorizontal: 16 }} />

            {/* Nearest store */}
            <Pressable style={[styles.card, { marginTop: 8 }]} onPress={() => Linking.openURL(mapsUrl)}>
              <View style={styles.shopRow}>
                <View style={[styles.shopIcon, { backgroundColor: '#4285F4' }]}>
                  <SFIcon name="location.fill" size={14} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>Magasin le plus proche</Text>
                  <Text style={styles.shopSub}>Ouvrir dans Google Maps</Text>
                </View>
                <SFIcon name="arrow.up.right" size={14} color={C.brand} />
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable
          style={({ pressed }) => [styles.cta, isDone && styles.ctaDone, pressed && { opacity: 0.7 }]}
          onPress={handleToggle}
        >
          <SFIcon name={isDone ? 'arrow.clockwise' : 'checkmark'} size={18} color={isDone ? C.label : 'white'} weight="medium" />
          <Text style={[styles.ctaText, isDone && { color: C.label }]}>
            {isDone ? 'Rouvrir le rappel' : 'Marquer comme fait'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, title, subtitle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <SFIcon name={icon} size={17} color={C.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <SFIcon name="chevron.right.small" size={15} color={C.tertiaryLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navBar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 17, color: C.brand, marginLeft: 2 },
  edit: { fontSize: 17, color: C.brand },

  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', height: 22, paddingHorizontal: 8, borderRadius: 6, backgroundColor: C.brandSoft, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '600', color: C.brand },
  title: { fontSize: 28, fontWeight: '700', color: C.label, marginBottom: 8, letterSpacing: 0.36 },
  when: { fontSize: 15, color: C.secondaryLabel },
  whenStrong: { color: C.label, fontWeight: '600' },
  desc: { fontSize: 15, color: C.secondaryLabel, marginTop: 12, lineHeight: 22 },

  sectionHeader: { fontSize: 12, fontWeight: '700', color: C.secondaryLabel, letterSpacing: 0.5, paddingHorizontal: 32, paddingBottom: 8 },

  card: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 10, overflow: 'hidden' },
  aiHintCard: { padding: 16 },
  aiHintHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiHintTitle: { fontSize: 13, fontWeight: '700', color: C.brand, letterSpacing: 0.2 },
  aiHintText: { fontSize: 15, color: C.label, lineHeight: 22, letterSpacing: -0.2 },
  aiContextRow: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: C.separator },
  aiLead: { fontSize: 15, fontWeight: '600', color: C.brandDeep, letterSpacing: -0.24 },
  aiText: { fontSize: 15, color: C.label, lineHeight: 20, letterSpacing: -0.24 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 44, borderTopWidth: 0.5, borderTopColor: C.separator },
  rowIcon: { width: 29, height: 29, borderRadius: 7, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, color: C.label, letterSpacing: -0.3 },
  rowSub: { fontSize: 13, color: C.secondaryLabel, marginTop: 1 },

  bestDeal: {
    marginHorizontal: 16, padding: 16, borderRadius: 14,
    backgroundColor: '#FFF8F0', borderWidth: 1.5, borderColor: '#FF6F00',
  },
  bestDealHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bestDealBadge: { fontSize: 11, fontWeight: '800', color: '#FF6F00', letterSpacing: 0.5 },
  bestDealTitle: { fontSize: 15, fontWeight: '600', color: C.label, lineHeight: 20, marginBottom: 6 },
  bestDealPrice: { fontSize: 24, fontWeight: '800', color: '#FF6F00', marginBottom: 4 },
  bestDealLink: { fontSize: 13, fontWeight: '600', color: '#FF6F00' },
  priceHistoryBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,111,0,0.2)' },
  priceHistoryTitle: { fontSize: 12, fontWeight: '700', color: C.secondaryLabel, letterSpacing: 0.3, marginBottom: 8 },
  priceHistoryRow: { flexDirection: 'row', gap: 12 },
  priceHistoryItem: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: 'rgba(255,111,0,0.08)', borderRadius: 8 },
  priceHistoryValue: { fontSize: 16, fontWeight: '700', color: '#FF6F00', marginBottom: 2 },
  priceHistoryLabel: { fontSize: 10, color: C.secondaryLabel, textAlign: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  trendText: { fontSize: 13, fontWeight: '600', color: C.label },
  trendAdvice: { fontSize: 12, color: C.secondaryLabel, fontStyle: 'italic', marginTop: 6, lineHeight: 17 },

  msConnectCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  msConnectIcon: { fontSize: 22 },
  msConnectTitle: { fontSize: 15, fontWeight: '600', color: C.label },
  msConnectSub: { fontSize: 12, color: C.secondaryLabel, marginTop: 2, lineHeight: 16 },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 52 },
  msItemTitle: { fontSize: 14, fontWeight: '600', color: C.label, letterSpacing: -0.2 },
  msItemSub: { fontSize: 12, color: C.secondaryLabel, marginTop: 2 },
  teamsBtn: { backgroundColor: '#0078D4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  teamsBtnText: { fontSize: 12, fontWeight: '700', color: 'white' },
  personAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { fontSize: 15, fontWeight: '700', color: C.brand },

  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 48 },
  shopBorder: { borderTopWidth: 0.5, borderTopColor: C.separator },
  shopIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '500', color: C.label, letterSpacing: -0.24 },
  shopSub: { fontSize: 12, color: C.secondaryLabel, marginTop: 1 },

  ctaArea: { position: 'absolute', bottom: 34, left: 16, right: 16 },
  cta: { height: 50, borderRadius: 14, backgroundColor: C.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ctaDone: { backgroundColor: C.systemGray5 },
  ctaText: { fontSize: 17, fontWeight: '600', color: 'white' },
});
