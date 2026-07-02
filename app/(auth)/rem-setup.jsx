import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { useRemindersStore } from '../../src/store/reminders.store';
import { C } from '../../src/theme';

const STEPS = [
  {
    key: 'rhythm',
    question: "T'es plutôt matin ou soir ?",
    sub: 'Rem adapte les horaires de tes rappels à ton rythme.',
    options: [
      { value: 'morning', label: 'Matin 🌅', desc: 'Levé tôt, productif dès 8h' },
      { value: 'evening', label: 'Soir 🌙', desc: 'Je suis plus efficace après 18h' },
      { value: 'flexible', label: 'Flexible ☀️', desc: 'Ça dépend des jours' },
    ],
  },
  {
    key: 'categories',
    question: 'Quelles catégories t\'utiliseras le plus ?',
    sub: 'Tu peux en choisir plusieurs.',
    multi: true,
    options: [
      { value: 'work', label: '💼 Travail' },
      { value: 'health', label: '❤️ Santé' },
      { value: 'errand', label: '🛒 Courses' },
      { value: 'habit', label: '🌱 Habitudes' },
      { value: 'personal', label: '🙋 Personnel' },
      { value: 'call', label: '📞 Appels' },
    ],
  },
  {
    key: 'goal',
    question: 'Ton objectif principal ?',
    sub: 'Rem va créer tes premiers rappels là-dessus.',
    options: [
      { value: 'organized', label: '📋 Être plus organisé', desc: 'Gérer mes tâches sans rien oublier' },
      { value: 'health', label: '💪 Prendre soin de moi', desc: 'Sport, sommeil, santé au quotidien' },
      { value: 'work', label: '🚀 Cartonner au boulot', desc: 'Deadlines, réunions, projets' },
      { value: 'habits', label: '🔄 Garder mes habitudes', desc: 'Routine, régularité, progression' },
    ],
  },
];

const STARTER_REMINDERS = {
  organized: [
    { title: 'Faire ma to-do du jour', category: 'personal', priority: 2, frequency: 'daily', hour: 8 },
    { title: 'Réviser mes rappels en cours', category: 'personal', priority: 2, frequency: 'daily', hour: 20 },
  ],
  health: [
    { title: 'Boire 1,5L d\'eau', category: 'health', priority: 2, frequency: 'daily', hour: 9 },
    { title: 'Séance de sport', category: 'health', priority: 3, frequency: 'weekly', hour: 7 },
  ],
  work: [
    { title: 'Préparer ma journée', category: 'work', priority: 3, frequency: 'daily', hour: 8 },
    { title: 'Bilan de fin de journée', category: 'work', priority: 2, frequency: 'daily', hour: 18 },
  ],
  habits: [
    { title: 'Méditer 10 minutes', category: 'habit', priority: 2, frequency: 'daily', hour: 7 },
    { title: 'Lire 20 minutes', category: 'habit', priority: 2, frequency: 'daily', hour: 21 },
  ],
};

function buildScheduledAt(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export default function RemSetupScreen() {
  const { setRemSetupSeen } = useAuthStore();
  const { create } = useRemindersStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ rhythm: null, categories: [], goal: null });
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];

  const select = (value) => {
    if (currentStep.multi) {
      setAnswers((a) => ({
        ...a,
        [currentStep.key]: a[currentStep.key].includes(value)
          ? a[currentStep.key].filter((v) => v !== value)
          : [...a[currentStep.key], value],
      }));
    } else {
      setAnswers((a) => ({ ...a, [currentStep.key]: value }));
    }
  };

  const isSelected = (value) => currentStep.multi
    ? answers[currentStep.key].includes(value)
    : answers[currentStep.key] === value;

  const canNext = currentStep.multi
    ? answers[currentStep.key].length > 0
    : answers[currentStep.key] !== null;

  const next = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    try {
      const starters = STARTER_REMINDERS[answers.goal] || STARTER_REMINDERS.organized;
      for (const r of starters) {
        await create({
          title: r.title,
          category: r.category,
          priority: r.priority,
          frequency: r.frequency,
          scheduled_at: buildScheduledAt(r.hour),
        });
      }
    } catch (_) {}
    await setRemSetupSeen();
    router.replace('/(app)/home');
  };

  const skip = async () => {
    await setRemSetupSeen();
    router.replace('/(app)/home');
  };

  const progress = (step + 1) / STEPS.length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>Rem</Text>
        </View>

        <Text style={styles.question}>{currentStep.question}</Text>
        <Text style={styles.sub}>{currentStep.sub}</Text>

        <View style={styles.options}>
          {currentStep.options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.option, isSelected(opt.value) && styles.optionSelected]}
              onPress={() => select(opt.value)}
            >
              <Text style={[styles.optionLabel, isSelected(opt.value) && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              {opt.desc && (
                <Text style={[styles.optionDesc, isSelected(opt.value) && styles.optionDescSelected]}>
                  {opt.desc}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.foot}>
        <Text style={styles.stepLabel}>{step + 1} / {STEPS.length}</Text>
        <Pressable
          style={[styles.btn, (!canNext || saving) && styles.btnDisabled]}
          onPress={next}
          disabled={!canNext || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>
                {step < STEPS.length - 1 ? 'Continuer →' : 'C\'est parti !'}
              </Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  progressBar: {
    flex: 1, height: 4, borderRadius: 999,
    backgroundColor: 'rgba(127,119,221,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 999, backgroundColor: C.brand },
  skip: { fontSize: 15, color: C.brand, fontWeight: '500' },

  stage: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 0 },

  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, alignSelf: 'flex-start',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  question: {
    fontSize: 26, fontWeight: '800', color: '#1a1a2e',
    letterSpacing: -0.5, lineHeight: 32, marginBottom: 8,
  },
  sub: { fontSize: 15, color: '#888', lineHeight: 22, marginBottom: 28 },

  options: { gap: 12 },
  option: {
    padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(127,119,221,0.2)',
    backgroundColor: 'rgba(127,119,221,0.04)',
  },
  optionSelected: {
    borderColor: C.brand, backgroundColor: 'rgba(127,119,221,0.1)',
  },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionLabelSelected: { color: C.brand },
  optionDesc: { fontSize: 13, color: '#aaa', marginTop: 3 },
  optionDescSelected: { color: 'rgba(127,119,221,0.7)' },

  foot: { paddingHorizontal: 24, paddingBottom: 24, gap: 10, alignItems: 'center' },
  stepLabel: { fontSize: 13, color: '#ccc', fontWeight: '500' },
  btn: {
    width: '100%', height: 54, borderRadius: 16,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
