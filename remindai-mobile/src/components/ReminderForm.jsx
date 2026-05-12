import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemindersStore } from '../store/reminders.store';
import PriceComparison from './PriceComparison';

const CATEGORIES = [
  { value: 'personal', label: '👤 Personnel' },
  { value: 'work',     label: '💼 Travail' },
  { value: 'health',   label: '💪 Santé' },
  { value: 'errand',   label: '🛒 Course' },
  { value: 'habit',    label: '🔄 Habitude' },
  { value: 'call',     label: '📞 Appel' },
];

const FREQUENCIES = [
  { value: 'once',    label: 'Une fois' },
  { value: 'daily',   label: 'Chaque jour' },
  { value: 'weekly',  label: 'Chaque semaine' },
  { value: 'monthly', label: 'Chaque mois' },
  { value: 'custom',  label: 'Personnalisée' },
];

const WEEKDAYS = [
  { value: 0, label: 'Dim' }, { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' }, { value: 4, label: 'Jeu' }, { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
];

const PRIORITIES = [
  { value: 1, label: 'Faible', color: '#b0b0b0' },
  { value: 2, label: 'Normal', color: '#FFB800' },
  { value: 3, label: 'Haute',  color: '#FF8C42' },
  { value: 4, label: 'Urgent', color: '#E0654A' },
];

const GEO_LOCATION_TYPES = [
  { value: 'Supermarché',  label: '🛒 Supermarché' },
  { value: 'Pharmacie',    label: '💊 Pharmacie' },
  { value: 'Boulangerie',  label: '🥐 Boulangerie' },
  { value: 'Magasin',      label: '🏪 Magasin' },
  { value: 'Bureau',       label: '💼 Bureau' },
  { value: 'Personnalisé', label: '📍 Personnalisé' },
];

const GEO_RADII = [100, 200, 500, 1000, 2000];

// Show price comparison for errand/shopping-type reminders
const SHOW_PRICE_CATEGORIES = ['errand'];
const SHOW_PRICE_KEYWORDS = ['acheter', 'achat', 'courses', 'achète', 'commander', 'buy'];

function shouldShowPrices(title, category) {
  if (SHOW_PRICE_CATEGORIES.includes(category)) return true;
  const lower = title.toLowerCase();
  return SHOW_PRICE_KEYWORDS.some((kw) => lower.includes(kw));
}

function Pill({ label, selected, onPress, color }) {
  return (
    <Pressable
      style={[styles.pill, selected && { borderColor: color || '#7F77DD', backgroundColor: color ? `${color}22` : '#f0efff' }]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, selected && { color: color || '#7F77DD', fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ReminderForm({ visible, reminder, onClose, onSaved }) {
  const { create, update } = useRemindersStore();
  const isEdit = !!reminder;

  const [title, setTitle] = useState(reminder?.title ?? '');
  const [description, setDescription] = useState(reminder?.description ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    reminder?.scheduled_at ? new Date(reminder.scheduled_at) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [category, setCategory] = useState(reminder?.category ?? 'personal');
  const [priority, setPriority] = useState(reminder?.priority ?? 2);
  const [frequency, setFrequency] = useState(reminder?.frequency ?? 'once');
  const [frequencyDays, setFrequencyDays] = useState(reminder?.frequency_days ?? []);

  // Geo state
  const [useGeolocation, setUseGeolocation] = useState(reminder?.use_geolocation ? true : false);
  const [locationType, setLocationType] = useState(reminder?.location_name ?? 'Supermarché');
  const [locationRadius, setLocationRadius] = useState(reminder?.location_radius ?? 500);

  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduledAt(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setCategory('personal');
    setPriority(2);
    setFrequency('once');
    setFrequencyDays([]);
    setUseGeolocation(false);
    setLocationType('Supermarché');
    setLocationRadius(500);
  };

  const toggleDay = (day) =>
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez entrer un titre pour le rappel.');
      return;
    }
    if (frequency === 'weekly' && frequencyDays.length === 0) {
      Alert.alert('Jours requis', 'Veuillez sélectionner au moins un jour.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: scheduledAt?.toISOString() ?? null,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        category,
        priority,
        frequency,
        frequency_days: (frequency === 'weekly' || frequency === 'custom') ? frequencyDays : [],
        frequencyDays: (frequency === 'weekly' || frequency === 'custom') ? frequencyDays : [],
        use_geolocation: useGeolocation ? 1 : 0,
        useGeolocation,
        location_name: useGeolocation ? locationType : null,
        locationName: useGeolocation ? locationType : null,
        location_radius: locationRadius,
        locationRadius,
      };

      if (isEdit) {
        await update(reminder.id, data);
      } else {
        await create(data);
        resetForm();
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const showPrices = shouldShowPrices(title, category) && title.trim().length > 4;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEdit ? 'Modifier le rappel' : 'Nouveau rappel'}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Appeler maman"
            placeholderTextColor="#ccc"
            maxLength={500}
            autoFocus={!isEdit}
          />
        </View>

        {/* Price comparison — shown for shopping reminders */}
        {showPrices && (
          <View style={styles.field}>
            <Text style={styles.label}>💰 Comparaison de prix</Text>
            <PriceComparison productName={title.trim()} />
          </View>
        )}

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Note (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Détails..."
            placeholderTextColor="#ccc"
            multiline
            numberOfLines={3}
            maxLength={2000}
          />
        </View>

        {/* Notification mode toggle */}
        <View style={styles.field}>
          <Text style={styles.label}>Mode de notification</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, !useGeolocation && styles.modeBtnActive]}
              onPress={() => setUseGeolocation(false)}
            >
              <Text style={[styles.modeBtnText, !useGeolocation && styles.modeBtnTextActive]}>
                🕐 Heure fixe
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, useGeolocation && styles.modeBtnActive]}
              onPress={() => setUseGeolocation(true)}
            >
              <Text style={[styles.modeBtnText, useGeolocation && styles.modeBtnTextActive]}>
                📍 Géolocalisation
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date & Time — only for fixed-time mode */}
        {!useGeolocation && (
          <View style={styles.field}>
            <Text style={styles.label}>Date et heure</Text>
            <View style={styles.row}>
              <Pressable style={[styles.input, styles.dateBtn]} onPress={() => setShowDatePicker(true)}>
                <Text style={scheduledAt ? styles.dateText : styles.datePlaceholder}>
                  {scheduledAt ? format(scheduledAt, 'd MMM yyyy', { locale: fr }) : 'Date'}
                </Text>
              </Pressable>
              <Pressable style={[styles.input, styles.timeBtn]} onPress={() => setShowTimePicker(true)}>
                <Text style={scheduledAt ? styles.dateText : styles.datePlaceholder}>
                  {scheduledAt ? format(scheduledAt, 'HH:mm') : 'Heure'}
                </Text>
              </Pressable>
              {scheduledAt && (
                <Pressable style={styles.clearBtn} onPress={() => setScheduledAt(null)}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledAt ?? new Date()}
                mode="date"
                display="spinner"
                locale="fr"
                onChange={(_, date) => { setShowDatePicker(false); if (date) setScheduledAt((prev) => mergeDatetime(prev, date, 'date')); }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledAt ?? new Date()}
                mode="time"
                display="spinner"
                locale="fr"
                onChange={(_, date) => { setShowTimePicker(false); if (date) setScheduledAt((prev) => mergeDatetime(prev, date, 'time')); }}
              />
            )}
          </View>
        )}

        {/* Geo settings — only for geo mode */}
        {useGeolocation && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Type de lieu</Text>
              <View style={styles.pillRow}>
                {GEO_LOCATION_TYPES.map((loc) => (
                  <Pill
                    key={loc.value}
                    label={loc.label}
                    selected={locationType === loc.value}
                    onPress={() => setLocationType(loc.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Rayon de notification</Text>
              <View style={styles.radiiRow}>
                {GEO_RADII.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.radiusBtn, locationRadius === r && styles.radiusBtnSelected]}
                    onPress={() => setLocationRadius(r)}
                  >
                    <Text style={[styles.radiusBtnText, locationRadius === r && styles.radiusBtnTextSelected]}>
                      {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.geoHint}>
                Vous serez notifié·e quand vous serez à moins de {locationRadius >= 1000 ? `${locationRadius / 1000} km` : `${locationRadius} m`} d'un·e {locationType.toLowerCase()}.
              </Text>
            </View>
          </>
        )}

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <Pill key={c.value} label={c.label} selected={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.pillRow}>
            {PRIORITIES.map((p) => (
              <Pill key={p.value} label={p.label} selected={priority === p.value} onPress={() => setPriority(p.value)} color={p.color} />
            ))}
          </View>
        </View>

        {/* Frequency — only for fixed-time mode */}
        {!useGeolocation && (
          <View style={styles.field}>
            <Text style={styles.label}>Fréquence</Text>
            <View style={styles.pillRow}>
              {FREQUENCIES.map((f) => (
                <Pill key={f.value} label={f.label} selected={frequency === f.value} onPress={() => setFrequency(f.value)} />
              ))}
            </View>
          </View>
        )}

        {/* Day picker */}
        {!useGeolocation && (frequency === 'weekly' || frequency === 'custom') && (
          <View style={styles.field}>
            <Text style={styles.label}>
              {frequency === 'weekly' ? 'Quel(s) jour(s)?' : 'Jours personnalisés'}
            </Text>
            <View style={styles.dayRow}>
              {WEEKDAYS.map((d) => (
                <Pressable
                  key={d.value}
                  style={[styles.dayBtn, frequencyDays.includes(d.value) && styles.dayBtnSelected]}
                  onPress={() => toggleDay(d.value)}
                >
                  <Text style={[styles.dayBtnText, frequencyDays.includes(d.value) && styles.dayBtnTextSelected]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : isEdit ? 'Sauvegarder' : 'Créer le rappel'}</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

function mergeDatetime(existing, incoming, mode) {
  const base = existing ? new Date(existing) : new Date();
  if (mode === 'date') {
    base.setFullYear(incoming.getFullYear(), incoming.getMonth(), incoming.getDate());
  } else {
    base.setHours(incoming.getHours(), incoming.getMinutes(), 0, 0);
  }
  return base;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#555' },

  field: { padding: 20, paddingBottom: 0 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10, letterSpacing: 0.3 },

  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#eee',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dateBtn: { flex: 2 },
  timeBtn: { flex: 1 },
  dateText: { fontSize: 15, color: '#222' },
  datePlaceholder: { fontSize: 15, color: '#ccc' },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, color: '#999' },

  // Notification mode
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff',
  },
  modeBtnActive: { borderColor: '#7F77DD', backgroundColor: '#7F77DD' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modeBtnTextActive: { color: '#fff' },

  // Geo radius
  radiiRow: { flexDirection: 'row', gap: 6 },
  radiusBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff',
  },
  radiusBtnSelected: { borderColor: '#1D9E75', backgroundColor: '#1D9E75' },
  radiusBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  radiusBtnTextSelected: { color: '#fff' },
  geoHint: { marginTop: 8, fontSize: 12, color: '#999', fontStyle: 'italic' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  pillText: { fontSize: 13, color: '#555' },

  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff',
  },
  dayBtnSelected: { borderColor: '#7F77DD', backgroundColor: '#7F77DD' },
  dayBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },
  dayBtnTextSelected: { color: '#fff' },

  actions: { padding: 20, paddingTop: 32, gap: 12 },
  saveBtn: {
    backgroundColor: '#7F77DD', padding: 16, borderRadius: 14, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#999' },
});
