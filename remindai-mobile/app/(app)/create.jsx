import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemindersStore } from '../../src/store/reminders.store';
import { parseNLP } from '../../src/utils/nlp';

const PRIORITY_LABELS = ['Bas', 'Normal', 'Haut', 'Urgent'];
const PRIORITY_COLORS = ['#999', '#FFB800', '#FF8C42', '#E0654A'];

export default function CreateScreen() {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const { create, reminders } = useRemindersStore();
  const router = useRouter();

  const handleParse = () => {
    if (!input.trim()) return;
    setParsing(true);
    try {
      const result = parseNLP(input.trim());
      setParsed(result);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;
    const activeCount = reminders.filter((r) => !r.completed_at && !r.deleted_at).length;
    if (activeCount >= 20) {
      Alert.alert(
        'Limite atteinte',
        'Le plan gratuit est limité à 20 rappels. Passez à Pro pour des rappels illimités.',
        [
          { text: 'Passer à Pro', onPress: () => router.push('/(app)/paywall') },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      await create({
        title: parsed.title,
        category: parsed.category,
        scheduled_at: parsed.scheduledAt.toISOString(),
        priority: parsed.priority,
      });
      router.back();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer le rappel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Nouveau rappel</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={"\"Appelle Jean demain à 15h\""}
        placeholderTextColor="#bbb"
        value={input}
        onChangeText={setInput}
        multiline
        maxLength={500}
        onSubmitEditing={handleParse}
        testID="reminder-input"
      />

      <Pressable
        style={[styles.parseBtn, (!input.trim() || parsing) && styles.parseBtnDisabled]}
        onPress={handleParse}
        disabled={!input.trim() || parsing}
        testID="parse-button"
      >
        {parsing
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.parseBtnText}>🧠 Analyser</Text>
        }
      </Pressable>

      {parsed && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Titre</Text>
          <TextInput
            style={styles.cardInput}
            value={parsed.title}
            onChangeText={(v) => setParsed({ ...parsed, title: v })}
          />

          <Text style={styles.cardLabel}>Quand</Text>
          <Text style={styles.cardValue}>
            {format(parsed.scheduledAt, "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
          </Text>

          <Text style={styles.cardLabel}>Catégorie</Text>
          <Text style={styles.cardValue}>{parsed.category}</Text>

          <Text style={styles.cardLabel}>Priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_LABELS.map((label, i) => (
              <Pressable
                key={i}
                style={[
                  styles.priorityBtn,
                  parsed.priority === i + 1 && { backgroundColor: PRIORITY_COLORS[i] },
                ]}
                onPress={() => setParsed({ ...parsed, priority: i + 1 })}
              >
                <Text style={[styles.priorityBtnText, parsed.priority === i + 1 && { color: '#fff' }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.createBtn, saving && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
            testID="create-button"
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>Créer le rappel ✓</Text>
            }
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 16 },
  backText: { fontSize: 20, color: '#999' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  input: {
    marginHorizontal: 20, borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 14, padding: 16, fontSize: 16, minHeight: 100,
    color: '#222', marginBottom: 12, textAlignVertical: 'top',
  },
  parseBtn: {
    marginHorizontal: 20, backgroundColor: '#7F77DD', padding: 14,
    borderRadius: 12, alignItems: 'center', marginBottom: 20,
  },
  parseBtnDisabled: { opacity: 0.5 },
  parseBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  card: {
    marginHorizontal: 20, backgroundColor: '#f9f9f9', borderRadius: 16,
    padding: 20, marginBottom: 40,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginTop: 14, marginBottom: 4 },
  cardValue: { fontSize: 15, color: '#333' },
  cardInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#222',
  },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityBtn: {
    flex: 1, padding: 8, borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 8, alignItems: 'center',
  },
  priorityBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  createBtn: {
    backgroundColor: '#1D9E75', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
