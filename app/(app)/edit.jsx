import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import { findConflict } from '../../src/utils/conflicts';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { C } from '../../src/theme';

function fmtTime(isoStr) {
  if (!isoStr) return '09:00';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDate(isoStr) {
  if (!isoStr) return "Aujourd'hui";
  const d = new Date(isoStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const store = useRemindersStore();
  const r = store.reminders.find((x) => x.id === id);

  const [title, setTitle] = useState(r?.title || '');
  const [time, setTime] = useState(r ? fmtTime(r.scheduled_at) : '09:00');
  const [notifBefore, setNotifBefore] = useState(true);
  const [notifGeo, setNotifGeo] = useState(!!r?.use_geolocation);
  const [used, setUsed] = useState([]);

  if (!r) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: C.secondaryLabel }}>Rappel introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ideas = [
    {
      id: 'title',
      icon: 'sparkle.small',
      label: 'Reformuler plus clairement',
      preview: `${r.title} — reformulé`,
      apply: () => setTitle(`${r.title} (reformulé)`),
    },
    {
      id: 'time',
      icon: 'clock',
      label: 'Meilleur créneau détecté',
      preview: '08:45 — tu as un créneau libre',
      apply: () => setTime('08:45'),
    },
    {
      id: 'geo',
      icon: 'location',
      label: "Ajouter un rappel à l'arrivée",
      preview: 'Te prévenir quand tu arrives sur place',
      apply: () => setNotifGeo(true),
    },
  ];

  const useIdea = (idea) => {
    idea.apply();
    setUsed((u) => [...u, idea.id]);
  };

  const save = () => {
    const [h, m] = time.split(':').map(Number);
    const d = r.scheduled_at ? new Date(r.scheduled_at) : new Date();
    d.setHours(h || 9, m || 0, 0, 0);
    const scheduledAt = d.toISOString();

    const finalize = () => {
      store.update(r.id, { title, scheduledAt });
      router.back();
    };

    const conflict = findConflict(store.reminders, scheduledAt, r.id);
    if (conflict) {
      Alert.alert(
        'Conflit d\'horaire',
        `Tu as déjà "${conflict.title}" prévu à ${fmtTime(conflict.scheduled_at)}. Enregistrer quand même ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Enregistrer quand même', onPress: finalize },
        ],
      );
      return;
    }

    finalize();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.handle} />
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Annuler</Text>
        </Pressable>
        <Text style={styles.navTitle}>Modifier</Text>
        <Pressable onPress={save} hitSlop={10}>
          <Text style={styles.ok}>OK</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text style={styles.header}>NOM DU RAPPEL</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.nameInput}
            value={title}
            onChangeText={setTitle}
            multiline
            placeholder="Nom du rappel"
            placeholderTextColor={C.tertiaryLabel}
          />
        </View>

        {/* Time */}
        <Text style={styles.header}>QUAND</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="clock" />
            <Text style={styles.rowTitle}>Heure</Text>
            <TextInput
              style={styles.timeInput}
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Icon name="calendar" />
            <Text style={styles.rowTitle}>Date</Text>
            <Text style={styles.rowValue}>{fmtDate(r.scheduled_at)}</Text>
            <SFIcon name="chevron.right.small" size={14} color={C.tertiaryLabel} />
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.header}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="bell" />
            <Text style={styles.rowTitle}>15 min avant</Text>
            <Switch value={notifBefore} onValueChange={setNotifBefore} trackColor={{ true: C.brand }} />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Icon name="location.fill" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>À l'arrivée</Text>
              <Text style={styles.rowSub}>Activer le géo-rappel</Text>
            </View>
            <Switch value={notifGeo} onValueChange={setNotifGeo} trackColor={{ true: C.brand }} />
          </View>
        </View>

        {/* AI ideas */}
        <Text style={styles.header}>L'IA SUGGÈRE</Text>
        <View style={styles.ideaStack}>
          {ideas.map((idea) => {
            const isUsed = used.includes(idea.id);
            return (
              <Pressable
                key={idea.id}
                style={[styles.ideaCard, isUsed && styles.ideaUsed]}
                onPress={() => !isUsed && useIdea(idea)}
                disabled={isUsed}
              >
                <View style={[styles.ideaIcon, isUsed && { backgroundColor: C.brandTeal }]}>
                  <SFIcon name={isUsed ? 'checkmark.bold' : idea.icon} size={15} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ideaLabel, isUsed && { color: C.secondaryLabel }]}>{idea.label}</Text>
                  <Text style={styles.ideaPreview}>{idea.preview}</Text>
                </View>
                {!isUsed && <Text style={styles.ideaApply}>Appliquer</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Icon({ name }) {
  return (
    <View style={styles.rowIcon}>
      <SFIcon name={name} size={16} color={C.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  handle: { width: 36, height: 5, borderRadius: 999, backgroundColor: C.systemGray3, alignSelf: 'center', marginTop: 6 },
  nav: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  cancel: { fontSize: 17, color: C.brand },
  navTitle: { fontSize: 17, fontWeight: '600', color: C.label },
  ok: { fontSize: 17, fontWeight: '600', color: C.brand },

  header: { fontSize: 12, fontWeight: '700', color: C.secondaryLabel, letterSpacing: 0.5, paddingHorizontal: 32, paddingBottom: 7, paddingTop: 18 },

  card: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 10, overflow: 'hidden' },
  nameInput: { fontSize: 17, fontWeight: '500', color: C.label, padding: 14, minHeight: 56, letterSpacing: -0.43 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, minHeight: 48 },
  rowBorder: { borderTopWidth: 0.5, borderTopColor: C.separator },
  rowIcon: { width: 29, height: 29, borderRadius: 7, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, color: C.label, letterSpacing: -0.3, flex: 1 },
  rowSub: { fontSize: 13, color: C.secondaryLabel, marginTop: 1 },
  rowValue: { fontSize: 16, color: C.secondaryLabel },
  timeInput: { fontSize: 16, fontWeight: '500', color: C.label, backgroundColor: C.tertiarySystemFill, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, minWidth: 70, textAlign: 'center' },

  ideaStack: { gap: 8, paddingHorizontal: 16 },
  ideaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 14, backgroundColor: 'rgba(127,119,221,0.07)', borderWidth: 1, borderColor: 'rgba(127,119,221,0.16)' },
  ideaUsed: { backgroundColor: C.surface, borderColor: C.separator },
  ideaIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  ideaLabel: { fontSize: 14, fontWeight: '600', color: C.label, letterSpacing: -0.24, marginBottom: 2 },
  ideaPreview: { fontSize: 12.5, color: C.secondaryLabel, lineHeight: 17 },
  ideaApply: { fontSize: 13, fontWeight: '600', color: C.brand },
});
