import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { budgetAPI } from '../api/budget';

const CATEGORIES = [
  { value: 'errand',   label: '🛒 Courses' },
  { value: 'health',   label: '💊 Santé' },
  { value: 'work',     label: '💼 Travail' },
  { value: 'personal', label: '👤 Personnel' },
  { value: 'habit',    label: '🔄 Habitudes' },
  { value: 'call',     label: '📞 Appels' },
];

const PERIODS = [
  { value: 'weekly',  label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly',  label: 'Annuelle' },
];

const THRESHOLDS = [
  { value: 0.5, label: '50 %' },
  { value: 0.7, label: '70 %' },
  { value: 0.8, label: '80 %' },
  { value: 0.9, label: '90 %' },
];

function Pill({ label, selected, onPress }) {
  return (
    <Pressable
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function BudgetSettings({ visible, initialCategory, initialPeriod, initialLimit, initialThreshold, onClose, onSaved }) {
  const [category, setCategory] = useState(initialCategory ?? 'errand');
  const [period, setPeriod] = useState(initialPeriod ?? 'monthly');
  const [limitText, setLimitText] = useState(String(initialLimit ?? 100));
  const [threshold, setThreshold] = useState(initialThreshold ?? 0.8);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const budgetLimit = parseFloat(limitText.replace(',', '.'));
    if (isNaN(budgetLimit) || budgetLimit <= 0) {
      Alert.alert('Montant invalide', 'Veuillez entrer un montant positif.');
      return;
    }

    setSaving(true);
    try {
      await budgetAPI.set({ category, budgetLimit, period, alertThreshold: threshold });
      onSaved?.();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder le budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres budget</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <Pill key={c.value} label={c.label} selected={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </View>
        </View>

        {/* Budget amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Budget (€)</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={limitText}
              onChangeText={setLimitText}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor="#ccc"
              maxLength={8}
            />
            <Text style={styles.currencyLabel}>€</Text>
          </View>
        </View>

        {/* Alert threshold */}
        <View style={styles.field}>
          <Text style={styles.label}>Alerter à</Text>
          <View style={styles.pillRow}>
            {THRESHOLDS.map((t) => (
              <Pill
                key={t.value}
                label={t.label}
                selected={Math.abs(threshold - t.value) < 0.01}
                onPress={() => setThreshold(t.value)}
              />
            ))}
          </View>
          <Text style={styles.hint}>
            Vous serez alerté·e quand vous atteignez {Math.round(threshold * 100)} % de votre budget.
          </Text>
        </View>

        {/* Period */}
        <View style={styles.field}>
          <Text style={styles.label}>Période</Text>
          <View style={styles.periodCol}>
            {PERIODS.map((p) => (
              <Pressable key={p.value} style={styles.radioRow} onPress={() => setPeriod(p.value)}>
                <View style={[styles.radio, period === p.value && styles.radioSelected]}>
                  {period === p.value && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#222' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#555' },

  field: { padding: 20, paddingBottom: 0 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10, letterSpacing: 0.3 },
  hint: { marginTop: 8, fontSize: 11, color: '#aaa', fontStyle: 'italic' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  pillSelected: { borderColor: '#7F77DD', backgroundColor: '#f0efff' },
  pillText: { fontSize: 13, color: '#555' },
  pillTextSelected: { color: '#7F77DD', fontWeight: '700' },

  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#eee', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 22, fontWeight: '700', color: '#222',
  },
  currencyLabel: { fontSize: 22, fontWeight: '700', color: '#aaa' },

  periodCol: { gap: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#7F77DD' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7F77DD' },
  radioLabel: { fontSize: 15, color: '#333' },

  actions: { padding: 20, paddingTop: 32, gap: 12 },
  saveBtn: { backgroundColor: '#7F77DD', padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#999' },
});
