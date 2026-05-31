import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoutinesStore } from '../store/routines.store';
import { localDB } from '../db/sqlite';

const CATEGORIES = ['personal', 'work', 'health', 'errand', 'habit'];
const PRIORITIES = [
  { value: 1, label: 'Basse' },
  { value: 2, label: 'Normale' },
  { value: 3, label: 'Haute' },
];

function makeStepId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function blankStep() {
  return {
    id: makeStepId(),
    title: '',
    category: 'personal',
    priority: 2,
    delayMinutes: 0,
    condition: 'always',
  };
}

export default function RoutineForm({ visible, routine, onClose, onSaved }) {
  const { create, update } = useRoutinesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([blankStep()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (routine) {
        setName(routine.name || '');
        setDescription(routine.description || '');
        localDB.getRoutineSteps(routine.id).then((dbSteps) => {
          if (dbSteps && dbSteps.length > 0) {
            setSteps(
              dbSteps.map((s) => ({
                id: makeStepId(),
                title: s.title,
                category: s.category || 'personal',
                priority: s.priority ?? 2,
                delayMinutes: s.delay_minutes ?? 0,
                condition: s.condition || 'always',
              }))
            );
          } else {
            setSteps([blankStep()]);
          }
        });
      } else {
        setName('');
        setDescription('');
        setSteps([blankStep()]);
      }
    }
  }, [visible, routine]);

  const updateStep = (id, field, value) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addStep = () => {
    setSteps((prev) => [...prev, blankStep()]);
  };

  const removeStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const moveStep = (index, direction) => {
    setSteps((prev) => {
      const arr = [...prev];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la routine est requis.');
      return;
    }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une étape.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        steps: validSteps,
      };
      if (routine) {
        await update(routine.id, payload);
      } else {
        await create(payload);
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de sauvegarder la routine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {routine ? 'Modifier la routine' : 'Nouvelle routine'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nom de la routine</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Routine du matin"
              placeholderTextColor="#bbb"
              maxLength={80}
            />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre routine…"
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>

          <Text style={styles.sectionTitle}>Étapes</Text>

          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepIndex}>Étape {index + 1}</Text>
                <View style={styles.stepActions}>
                  <Pressable
                    style={styles.orderBtn}
                    onPress={() => moveStep(index, -1)}
                    disabled={index === 0}
                  >
                    <Text style={[styles.orderBtnText, index === 0 && styles.disabled]}>↑</Text>
                  </Pressable>
                  <Pressable
                    style={styles.orderBtn}
                    onPress={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                  >
                    <Text style={[styles.orderBtnText, index === steps.length - 1 && styles.disabled]}>↓</Text>
                  </Pressable>
                  <Pressable onPress={() => removeStep(step.id)} style={styles.deleteStepBtn}>
                    <Text style={styles.deleteStepText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>

              <TextInput
                style={styles.input}
                value={step.title}
                onChangeText={(v) => updateStep(step.id, 'title', v)}
                placeholder="Titre de l'étape"
                placeholderTextColor="#bbb"
                maxLength={100}
              />

              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.pills}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.pill, step.category === cat && styles.pillActive]}
                    onPress={() => updateStep(step.id, 'category', cat)}
                  >
                    <Text style={[styles.pillText, step.category === cat && styles.pillTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Priorité</Text>
              <View style={styles.pills}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p.value}
                    style={[styles.pill, step.priority === p.value && styles.pillActive]}
                    onPress={() => updateStep(step.id, 'priority', p.value)}
                  >
                    <Text style={[styles.pillText, step.priority === p.value && styles.pillTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Délai (minutes après le déclenchement)</Text>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                value={String(step.delayMinutes)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  updateStep(step.id, 'delayMinutes', isNaN(n) ? 0 : n);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#bbb"
              />

              <Text style={styles.fieldLabel}>Condition</Text>
              <View style={styles.pills}>
                <Pressable
                  style={[styles.pill, step.condition === 'always' && styles.pillActive]}
                  onPress={() => updateStep(step.id, 'condition', 'always')}
                >
                  <Text style={[styles.pillText, step.condition === 'always' && styles.pillTextActive]}>
                    Toujours
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.pill, step.condition === 'if_previous_done' && styles.pillActive]}
                  onPress={() => updateStep(step.id, 'condition', 'if_previous_done')}
                >
                  <Text style={[styles.pillText, step.condition === 'if_previous_done' && styles.pillTextActive]}>
                    Si précédent complété
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable style={styles.addStepBtn} onPress={addStep}>
            <Text style={styles.addStepText}>+ Ajouter une étape</Text>
          </Pressable>

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Sauvegarde…' : routine ? 'Sauvegarder' : 'Créer la routine'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8f8fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  cancelText: { fontSize: 16, color: '#7F77DD', width: 60 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#f4f4f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  inputSmall: { width: 80 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F77DD',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepIndex: { fontSize: 13, fontWeight: '700', color: '#7F77DD' },
  stepActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderBtn: {
    backgroundColor: '#f0f0f8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderBtnText: { fontSize: 14, color: '#7F77DD', fontWeight: '700' },
  disabled: { color: '#ccc' },
  deleteStepBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteStepText: { fontSize: 13, color: '#E0654A', fontWeight: '600' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f8',
    borderWidth: 1,
    borderColor: '#e0e0ee',
  },
  pillActive: { backgroundColor: '#7F77DD', borderColor: '#7F77DD' },
  pillText: { fontSize: 13, color: '#666' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  addStepBtn: {
    backgroundColor: '#f0eeff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d8d4ff',
    borderStyle: 'dashed',
  },
  addStepText: { color: '#7F77DD', fontWeight: '700', fontSize: 15 },
  saveBtn: {
    backgroundColor: '#7F77DD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
