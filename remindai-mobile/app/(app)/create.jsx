import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import { parseNLP } from '../../src/utils/nlp';
import { aiClient } from '../../src/utils/ai';
import AIChat from '../../src/components/AIChat';

export default function CreateScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const { create, reminders } = useRemindersStore();
  const router = useRouter();

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
          { role: 'ai', response: res },
        ]);
      } else {
        // Offline fallback — local NLP
        const parsed = parseNLP(userText);
        setMessages([
          { role: 'user', text: userText },
          { role: 'ai', response: {
            reminder: {
              title: parsed.title,
              scheduledAt: parsed.scheduledAt.toISOString(),
              category: parsed.category,
              priority: parsed.priority,
            },
            advice: 'Rappel analysé. Vérifie les détails et confirme.',
            suggestions: [],
            questions: [],
            qcm: null,
          }},
        ]);
      }
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleQCMAnswers = async (answers) => {
    setLoadingRecommendations(true);
    try {
      const reco = await aiClient.getRecommendations(originalMessage, answers);
      setRecommendations(reco);
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
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le rappel');
    } finally {
      setSaving(false);
    }
  };

  const lastAiMessage = messages.filter((m) => m.role === 'ai').slice(-1)[0];
  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>RemindAI Chat</Text>
        </View>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Dis-moi ce dont tu dois te souvenir.{'\n'}Je crée le rappel et te donne des conseils.
            </Text>
            <View style={styles.examples}>
              {[
                '"Acheter des croquettes pour mon chien"',
                '"Appeler maman"',
                '"Réviser maths vendredi"',
              ].map((ex) => (
                <Pressable
                  key={ex}
                  style={styles.examplePill}
                  onPress={() => handleAnalyze(ex.replace(/"/g, ''))}
                >
                  <Text style={styles.exampleText}>{ex}</Text>
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
              <ActivityIndicator size="small" color="#7F77DD" />
              <Text style={styles.thinkingText}>Analyse en cours...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar — hidden once QCM or recommendations are active */}
      {messages.length === 0 && (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder='"Acheter des croquettes pour mon chien"'
            placeholderTextColor="#bbb"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            testID="reminder-input"
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleAnalyze()}
            disabled={!input.trim() || loading}
            testID="parse-button"
          >
            <Text style={styles.sendBtnText}>→</Text>
          </Pressable>
        </View>
      )}

      {/* New reminder button — shown after advice */}
      {messages.length > 0 && !loading && (
        <View style={styles.inputBar}>
          <Pressable style={styles.newBtn} onPress={() => { setMessages([]); setRecommendations(null); setInput(''); }}>
            <Text style={styles.newBtnText}>+ Nouveau rappel</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 16 },
  backText: { fontSize: 20, color: '#999' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222' },

  hint: { paddingHorizontal: 20, paddingTop: 16 },
  hintText: { fontSize: 16, color: '#888', lineHeight: 24, textAlign: 'center', marginBottom: 20 },
  examples: { gap: 10, alignItems: 'flex-start' },
  examplePill: {
    borderWidth: 1, borderColor: '#e8e6f8', backgroundColor: '#f8f7ff',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
  },
  exampleText: { color: '#7F77DD', fontSize: 14 },

  chatArea: { paddingHorizontal: 16, paddingTop: 8 },

  thinkingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 12 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  aiAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  thinkingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f4f4f8', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  thinkingText: { color: '#999', fontSize: 14 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#222', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#7F77DD',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  newBtn: {
    flex: 1, borderWidth: 1, borderColor: '#7F77DD', borderRadius: 20,
    paddingVertical: 12, alignItems: 'center',
  },
  newBtnText: { color: '#7F77DD', fontSize: 14, fontWeight: '600' },
});
