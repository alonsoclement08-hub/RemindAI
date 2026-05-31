import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRemindersStore } from '../../src/store/reminders.store';
import { parseNLP } from '../../src/utils/nlp';
import { aiClient } from '../../src/utils/ai';
import AIChat from '../../src/components/AIChat';
import qcmTemplates, { detectQCMLocal } from '../../src/utils/qcmTemplates';
import { C, RADIUS, SP, SHADOW } from '../../src/theme';

const SUGGESTIONS = [
  { emoji: '📞', text: 'Appeler maman demain à 18h' },
  { emoji: '🥖', text: 'Acheter du pain ce soir en rentrant' },
  { emoji: '🧘', text: 'Méditer 10 minutes chaque matin à 8h' },
  { emoji: '✉️', text: 'Envoyer le contrat à Léa avant vendredi' },
];

function buildStudyReco(message, answers) {
  const subject = answers.subject || 'ta matière';
  const type = answers.type || '';
  const duration = answers.duration || '1 heure';
  const difficulty = answers.difficulty || 'Moyen';
  const usesFlashcards = type.includes('Flashcard') || type.includes('Mémorisation');
  const usesExercises  = type.includes('Exercice');
  const recommendations = [
    { item: 'Technique Pomodoro', reason: `Travaille 25 min en pleine concentration, puis pause 5 min.` },
  ];
  if (usesFlashcards) {
    recommendations.push({ item: 'Floka (application gratuite)', reason: 'Crée des flashcards sur les notions clés de ' + subject + '.' });
  } else if (usesExercises) {
    recommendations.push({ item: 'Active recall', reason: 'Ferme ton cours et résous des exercices sans regarder les corrections.' });
  } else {
    recommendations.push({ item: 'Répétition espacée', reason: 'Relis tes notes à intervalles croissants : ce soir → +1 jour → +3 jours.' });
  }
  if (difficulty === 'Difficile') {
    recommendations.push({ item: 'Méthode Feynman', reason: 'Explique la notion comme si tu l\'enseignais à quelqu\'un.' });
  }
  return {
    intro: `Plan de révision pour ${subject} — ${duration}`,
    recommendations,
    avoid: usesFlashcards ? null : { item: 'Relire passivement sans tester', reason: 'Le sentiment de "je connais" est trompeur.' },
    tip: `💡 Commence par les points que tu maîtrises le moins.`,
  };
}

function withQCM(response, message) {
  if (response.qcm !== undefined) return response;
  const key = detectQCMLocal(message, response.reminder?.category, response.reminder?.reminderType);
  return { ...response, qcm: key ? { key, ...qcmTemplates[key] } : null };
}

export default function CreateScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const [qcmAnswered, setQcmAnswered] = useState(false);
  const { create, reminders } = useRemindersStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => {
    setInput('');
    setMessages([]);
    setRecommendations(null);
    setOriginalMessage('');
    setQcmAnswered(false);
  }, []));

  const checkLimit = () => {
    const active = reminders.filter((r) => !r.completed_at && !r.deleted_at).length;
    if (active >= 20) {
      Alert.alert(
        'Limite atteinte',
        'Le plan gratuit est limité à 20 rappels. Passez à Pro pour des rappels illimités.',
        [
          { text: 'Passer à Pro', onPress: () => router.push('/(app)/paywall') },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return false;
    }
    return true;
  };

  const handleAnalyze = async (text = input) => {
    if (!text.trim()) return;
    setLoading(true);
    const userText = text.trim();
    setOriginalMessage(userText);
    setRecommendations(null);
    try {
      const res = await aiClient.chat(userText);
      if (res?.reminder) {
        setMessages([
          { role: 'user', text: userText },
          { role: 'ai', response: withQCM(res, userText) },
        ]);
      } else {
        const parsed = parseNLP(userText);
        const baseResponse = {
          reminder: {
            title: parsed.title,
            scheduledAt: parsed.scheduledAt?.toISOString?.() ?? null,
            category: parsed.category,
            priority: parsed.priority,
            reminderType: null,
          },
          advice: '',
          suggestions: [],
          questions: [],
        };
        setMessages([
          { role: 'user', text: userText },
          { role: 'ai', response: withQCM(baseResponse, userText) },
        ]);
      }
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleQCMAnswers = async (answers) => {
    setQcmAnswered(true);
    setLoadingRecommendations(true);
    try {
      const reco = await aiClient.getRecommendations(originalMessage, answers);
      if (reco) {
        setRecommendations(reco);
      } else {
        const lastAiMsg = messages.filter((m) => m.role === 'ai').slice(-1)[0];
        const qcmKey = lastAiMsg?.response?.qcm?.key;
        if (qcmKey === 'study') {
          setRecommendations(buildStudyReco(originalMessage, answers));
        }
      }
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleConfirm = async (reminder) => {
    if (!checkLimit()) return;
    setSaving(true);
    try {
      await create({
        title: reminder.title,
        category: reminder.category ?? 'personal',
        scheduled_at: reminder.scheduledAt ?? new Date().toISOString(),
        priority: reminder.priority ?? 2,
      });
      router.back();
    } catch (err) {
      console.error('[CREATE] handleConfirm failed:', err);
      Alert.alert('Erreur', err?.message || 'Impossible de créer le rappel');
    } finally {
      setSaving(false);
    }
  };

  const lastAiMessage = messages.filter((m) => m.role === 'ai').slice(-1)[0];
  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];
  const isEmpty = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SP.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nouveau rappel</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty / suggestion state */}
        {isEmpty && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyBlock}>
            <View style={styles.emptyIcon}>
              <Text style={{ fontSize: 22, color: C.violet }}>✦</Text>
            </View>
            <Text style={styles.emptyTitle}>
              Dis-moi ce dont tu dois te souvenir.
            </Text>
            <Text style={styles.emptySub}>
              Je crée le rappel et te donne des conseils.
            </Text>
          </Animated.View>
        )}

        {isEmpty && (
          <View style={styles.suggestionsBlock}>
            <Text style={styles.suggestionsLabel}>SUGGESTIONS</Text>
            <View style={styles.suggestionsGrid}>
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
                  onPress={() => handleAnalyze(s.text)}
                >
                  <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
                  <Text style={styles.suggestionText}>{s.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Chat response */}
        {lastAiMessage && (
          <View style={styles.chatArea}>
            <AIChat
              userMessage={lastUserMessage?.text}
              response={lastAiMessage.response}
              onConfirm={handleConfirm}
              onFollowUp={(q) => handleAnalyze(q)}
              onQCMAnswers={handleQCMAnswers}
              qcmAnswered={qcmAnswered}
              saving={saving}
              loadingRecommendations={loadingRecommendations}
              recommendations={recommendations}
            />
          </View>
        )}

        {/* Analyzing indicator */}
        {loading && (
          <View style={styles.thinkingRow}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>IA</Text>
            </View>
            <View style={styles.thinkingBubble}>
              <ActivityIndicator size="small" color={C.violet} />
              <Text style={styles.thinkingText}>Analyse en cours…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      {messages.length === 0 && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + SP.md }]}>
          <View style={styles.inputWrap}>
            <View style={styles.inputLeading}>
              <Text style={{ color: C.violet, fontSize: 12 }}>✦</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={'Rappelle-moi de…'}
              placeholderTextColor={C.text4}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleAnalyze()}
              testID="reminder-input"
            />
          </View>
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={() => handleAnalyze()}
            disabled={!input.trim() || loading}
            testID="parse-button"
          >
            <Text style={styles.sendBtnText}>→</Text>
          </Pressable>
        </View>
      )}

      {/* New reminder button — shown after AI response */}
      {messages.length > 0 && !loading && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + SP.md }]}>
          <Pressable
            style={styles.newBtn}
            onPress={() => { setMessages([]); setRecommendations(null); setQcmAnswered(false); setInput(''); }}
          >
            <Text style={styles.newBtnText}>+ Nouveau rappel</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SP.xl, paddingBottom: SP.md,
    backgroundColor: C.bgTint, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: C.text2, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2 },

  scroll: { flex: 1, backgroundColor: C.bgTint },

  /* Empty state */
  emptyBlock: {
    alignItems: 'center', paddingTop: SP['4xl'], paddingHorizontal: SP['2xl'],
    marginBottom: SP['2xl'],
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: C.violetSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: SP.lg,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: C.text,
    textAlign: 'center', letterSpacing: -0.2, marginBottom: SP.sm,
  },
  emptySub: { fontSize: 14, color: C.text3, textAlign: 'center', lineHeight: 20 },

  /* Suggestions */
  suggestionsBlock: { paddingHorizontal: SP.xl },
  suggestionsLabel: {
    fontSize: 11, fontWeight: '700', color: C.text4,
    letterSpacing: 1, marginBottom: SP.md,
  },
  suggestionsGrid: { gap: SP.sm },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: SP.md,
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
    borderWidth: 1, borderColor: C.border,
    ...SHADOW.sm,
  },
  suggestionEmoji: { fontSize: 18 },
  suggestionText: { fontSize: 14, color: C.text2, flex: 1 },

  chatArea: { paddingHorizontal: SP.lg, paddingTop: SP.sm },

  /* Thinking */
  thinkingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SP.xl, marginTop: SP.md,
  },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center', marginRight: SP.md,
  },
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  thinkingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderWidth: 1, borderColor: C.border,
  },
  thinkingText: { color: C.text3, fontSize: 14 },

  /* Input bar */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm,
    paddingHorizontal: SP.xl, paddingTop: SP.md,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: RADIUS.card,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: SP.md, minHeight: 48,
  },
  inputLeading: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: C.violetSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SP.sm,
  },
  input: {
    flex: 1, fontSize: 15, color: C.text,
    paddingVertical: SP.sm, maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  sendBtnOff: { backgroundColor: C.surface3, shadowOpacity: 0 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  newBtn: {
    flex: 1, height: 46, borderRadius: RADIUS.btn,
    borderWidth: 1.5, borderColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  newBtnText: { color: C.violet, fontSize: 14, fontWeight: '600' },
});
