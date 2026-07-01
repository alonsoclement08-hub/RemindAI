import { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import { aiAPI } from '../../src/api/ai';
import { findConflict } from '../../src/utils/conflicts';
import AIChat from '../../src/components/AIChat';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { C } from '../../src/theme';

const SUGGESTIONS_CREATE = [
  'Appeler maman demain à 18h',
  'Acheter du pain en rentrant ce soir',
  'Méditer 10 minutes tous les matins',
];

const SUGGESTIONS_ASK = [
  "Qu'est-ce que j'ai prévu aujourd'hui ?",
  'Comment ça marche ?',
  'Des conseils pour mieux m\'organiser ?',
];

function fmtConflictTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function toCreatePayload(reminder) {
  return {
    title: reminder.title,
    category: reminder.category || 'personal',
    scheduled_at: reminder.scheduledAt || null,
    priority: reminder.priority || 2,
    frequency: 'once',
  };
}

export default function CreateScreen() {
  const { create, reminders } = useRemindersStore();
  const router = useRouter();

  const [mode, setMode] = useState('create'); // 'create' | 'ask'

  // "create" mode — each turn: { id, userMessage, response, qcmAnswered, recommendations, loadingRecommendations, saved }
  const [createTurns, setCreateTurns] = useState([]);
  // "ask" mode — each turn: { role: 'user'|'assistant', content }
  const [askMessages, setAskMessages] = useState([]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);

  useFocusEffect(useCallback(() => {
    setCreateTurns([]);
    setAskMessages([]);
    setInput('');
    setMode('create');
  }, []));

  const checkLimit = () => {
    const active = reminders.filter((r) => !r.completed_at && !r.deleted_at).length;
    if (active >= 20) {
      Alert.alert('Limite atteinte', 'Le plan gratuit est limité à 20 rappels.', [
        { text: 'Passer à Pro', onPress: () => router.push('/(app)/paywall') },
        { text: 'Annuler', style: 'cancel' },
      ]);
      return false;
    }
    return true;
  };

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  // ── "create" mode ──────────────────────────────────────────────────────────
  const buildCreateHistory = () => createTurns.flatMap((t) => ([
    { role: 'user', content: t.userMessage },
    { role: 'assistant', content: t.response?.reply || t.response?.advice || '' },
  ]));

  const sendCreateMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setLoading(true);
    const history = buildCreateHistory();

    try {
      const response = await aiAPI.chat(content, history, 'create');
      setCreateTurns((t) => [...t, { id: `${Date.now()}_${Math.random()}`, userMessage: content, response }]);
    } catch {
      setCreateTurns((t) => [...t, {
        id: `${Date.now()}_${Math.random()}`,
        userMessage: content,
        response: {
          advice: '', reply: "Oups, j'ai pas réussi à répondre. Réessaie 🔧",
          suggestions: [], questions: [], missingInfo: false, missingFields: [], reminder: null,
        },
      }]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const confirmReminder = (turnId, reminder) => {
    if (!reminder?.title) return;
    if (!checkLimit()) return;

    const finalize = () => {
      setSaving(true);
      create(toCreatePayload(reminder));
      setCreateTurns((t) => t.map((x) => (x.id === turnId ? { ...x, saved: true } : x)));
      setSaving(false);
    };

    const conflict = findConflict(reminders, reminder.scheduledAt);
    if (conflict) {
      Alert.alert(
        "Conflit d'horaire",
        `Tu as déjà "${conflict.title}" prévu à ${fmtConflictTime(conflict.scheduled_at)}. Créer quand même ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Créer quand même', onPress: finalize },
        ],
      );
      return;
    }
    finalize();
  };

  const submitQCM = async (turnId, userMessage, answers) => {
    setCreateTurns((t) => t.map((x) => (x.id === turnId ? { ...x, qcmAnswered: true, loadingRecommendations: true } : x)));
    try {
      const recommendations = await aiAPI.recommendations(userMessage, answers);
      setCreateTurns((t) => t.map((x) => (x.id === turnId ? { ...x, recommendations, loadingRecommendations: false } : x)));
    } catch {
      setCreateTurns((t) => t.map((x) => (x.id === turnId ? { ...x, loadingRecommendations: false } : x)));
    }
  };

  // ── "ask" mode — plain Q&A, never proposes a reminder ───────────────────────
  const sendAskMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setLoading(true);
    const history = askMessages.map((m) => ({ role: m.role, content: m.content }));
    const next = [...askMessages, { role: 'user', content }];
    setAskMessages(next);

    try {
      const response = await aiAPI.chat(content, history, 'ask');
      setAskMessages((m) => [...m, { role: 'assistant', content: response.reply || response.advice || '...' }]);
    } catch {
      setAskMessages((m) => [...m, { role: 'assistant', content: "Oups, j'ai pas réussi à répondre. Réessaie 🔧" }]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const send = mode === 'create' ? sendCreateMessage : sendAskMessage;
  const turns = mode === 'create' ? createTurns : askMessages;
  const suggestions = mode === 'create' ? SUGGESTIONS_CREATE : SUGGESTIONS_ASK;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.nav}>
        <Text style={styles.navTitle}>Assistant IA</Text>
      </View>

      <View style={styles.modeSwitch}>
        <Pressable
          style={[styles.modeOpt, mode === 'create' && styles.modeOptActive]}
          onPress={() => setMode('create')}
        >
          <Text style={[styles.modeOptText, mode === 'create' && styles.modeOptTextActive]}>Créer un rappel</Text>
        </Pressable>
        <Pressable
          style={[styles.modeOpt, mode === 'ask' && styles.modeOptActive]}
          onPress={() => setMode('ask')}
        >
          <Text style={[styles.modeOptText, mode === 'ask' && styles.modeOptTextActive]}>Poser une question</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stage}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {turns.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyMark}>
                <SFIcon name="sparkle.small" size={28} color="white" />
              </View>
              <Text style={styles.emptyTitle}>
                {mode === 'create' ? 'Quel est ton rappel ?' : "Salut, c'est Rémi 👋"}
              </Text>
              <Text style={styles.emptySub}>
                {mode === 'create'
                  ? "Écris-le ou dicte-le. L'IA devine la date, l'heure et le lieu."
                  : 'Pose-moi une question — je connais ton agenda.'}
              </Text>
              <View style={styles.suggest}>
                {suggestions.map((s) => (
                  <Pressable key={s} style={styles.suggestPill} onPress={() => send(s)}>
                    <Text style={styles.suggestText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : mode === 'create' ? (
            createTurns.map((t) => (
              <AIChat
                key={t.id}
                userMessage={t.userMessage}
                response={t.response}
                saving={saving}
                qcmAnswered={t.qcmAnswered}
                recommendations={t.recommendations}
                loadingRecommendations={t.loadingRecommendations}
                onConfirm={(reminder) => confirmReminder(t.id, reminder)}
                onFollowUp={(text) => sendCreateMessage(text)}
                onQCMAnswers={(answers) => submitQCM(t.id, t.userMessage, answers)}
              />
            ))
          ) : (
            askMessages.map((m, i) => (
              <View key={i} style={[styles.bubbleRow, m.role === 'user' && styles.bubbleRowUser]}>
                <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                  <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>{m.content}</Text>
                </View>
              </View>
            ))
          )}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.brand} />
            </View>
          )}
        </ScrollView>

        {(mode === 'ask' || turns.length === 0) && (
          <View style={styles.foot}>
            <View style={styles.compose}>
              <TextInput
                style={styles.composeInput}
                placeholder={mode === 'create' ? 'Rappelle-moi de…' : 'Écris à Rémi…'}
                placeholderTextColor={C.tertiaryLabel}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <Pressable style={[styles.composeBtn, styles.composeSend]} onPress={() => send()} disabled={loading || !input.trim()}>
                <SFIcon name="arrow.up" size={18} color="white" weight="medium" />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  nav: { height: 44, justifyContent: 'center', paddingHorizontal: 16 },
  navTitle: { fontSize: 17, fontWeight: '700', color: C.label },

  modeSwitch: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  modeOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(127,119,221,0.08)',
    borderWidth: 1, borderColor: 'rgba(127,119,221,0.16)',
  },
  modeOptActive: { backgroundColor: C.brand, borderColor: C.brand },
  modeOptText: { fontSize: 13, fontWeight: '600', color: C.brand },
  modeOptTextActive: { color: 'white' },

  stage: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyTitle: { fontSize: 26, fontWeight: '700', color: '#2A2440', letterSpacing: -0.4, marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'rgba(91,83,184,0.65)', textAlign: 'center', lineHeight: 22, maxWidth: 260, marginBottom: 26 },
  suggest: { gap: 8, width: '100%', maxWidth: 300 },
  suggestPill: { padding: 13, borderRadius: 14, backgroundColor: 'rgba(127,119,221,0.08)', borderWidth: 1, borderColor: 'rgba(127,119,221,0.16)' },
  suggestText: { fontSize: 14, fontWeight: '500', color: '#4A4376', letterSpacing: -0.24 },

  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleAi: { backgroundColor: C.surface, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: C.brand, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: C.label, lineHeight: 21 },
  bubbleTextUser: { color: 'white' },

  loadingRow: { alignItems: 'center', paddingVertical: 12 },

  foot: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  compose: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: 'white', borderWidth: 1.5, borderColor: 'rgba(127,119,221,0.22)', borderRadius: 24, paddingLeft: 18, paddingRight: 7, paddingVertical: 7 },
  composeInput: { flex: 1, fontSize: 17, fontWeight: '500', color: '#2A2440', letterSpacing: -0.3, maxHeight: 120, paddingVertical: 8 },
  composeBtn: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  composeSend: { backgroundColor: C.brand },
});
