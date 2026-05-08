import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AIChat({ userMessage, response, onConfirm, onFollowUp, saving }) {
  const [checkedSuggestions, setCheckedSuggestions] = useState([]);
  const [replyText, setReplyText] = useState('');

  const missingInfo = response?.missingInfo === true || !response?.reminder?.scheduledAt;

  const toggleSuggestion = (i) =>
    setCheckedSuggestions((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const scheduledLabel = response?.reminder?.scheduledAt
    ? format(new Date(response.reminder.scheduledAt), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })
    : null;

  const handleConfirm = () => onConfirm(response.reminder);

  const handleReplySend = () => {
    if (!replyText.trim()) return;
    onFollowUp(replyText.trim());
    setReplyText('');
  };

  return (
    <View style={styles.container}>
      {/* User bubble */}
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{userMessage}</Text>
        </View>
      </View>

      {/* AI bubble */}
      <View style={styles.aiBubbleWrap}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>IA</Text>
        </View>
        <View style={styles.aiBubble}>

          {/* Reminder pill — only shown when time is known */}
          {scheduledLabel ? (
            <View style={styles.reminderPill}>
              <Text style={styles.reminderPillTitle}>{response.reminder.title}</Text>
              <Text style={styles.reminderPillTime}>{scheduledLabel}</Text>
            </View>
          ) : (
            <View style={styles.reminderPillPending}>
              <Text style={styles.reminderPillTitle}>{response?.reminder?.title}</Text>
              <Text style={styles.reminderPillPendingTime}>Heure non définie</Text>
            </View>
          )}

          {/* Advice */}
          {!!response?.advice && (
            <Text style={styles.adviceText}>{response.advice}</Text>
          )}

          {/* Suggestions with checkboxes */}
          {response?.suggestions?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Suggestions</Text>
              {response.suggestions.map((s, i) => (
                <Pressable key={i} style={styles.checkRow} onPress={() => toggleSuggestion(i)}>
                  <View style={[styles.checkbox, checkedSuggestions.includes(i) && styles.checkboxChecked]}>
                    {checkedSuggestions.includes(i) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkLabel}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Questions */}
          {response?.questions?.length > 0 && (
            <View style={[styles.section, missingInfo && styles.questionsHighlighted]}>
              <Text style={[styles.sectionLabel, missingInfo && styles.sectionLabelUrgent]}>
                {missingInfo ? 'Il me faut ces infos' : 'Questions'}
              </Text>
              {response.questions.map((q, i) => (
                <Text key={i} style={styles.questionText}>• {q}</Text>
              ))}
            </View>
          )}

          {response?.nextStep && (
            <Text style={styles.nextStep}>{response.nextStep}</Text>
          )}
        </View>
      </View>

      {/* Reply input — always visible for follow-up */}
      <View style={styles.replyRow}>
        <TextInput
          style={styles.replyInput}
          placeholder={missingInfo ? 'Réponds aux questions...' : 'Poser une question...'}
          placeholderTextColor="#bbb"
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={300}
        />
        <Pressable
          style={[styles.replyBtn, !replyText.trim() && styles.replyBtnDisabled]}
          onPress={handleReplySend}
          disabled={!replyText.trim()}
        >
          <Text style={styles.replyBtnText}>→</Text>
        </Pressable>
      </View>

      {/* Confirm button — only shown when all required info is present */}
      {!missingInfo && (
        <Pressable
          style={[styles.confirmBtn, saving && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmBtnText}>Créer le rappel ✓</Text>
          }
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },

  userRow: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: {
    backgroundColor: '#7F77DD', borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%',
  },
  userText: { color: '#fff', fontSize: 15 },

  aiBubbleWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2,
  },
  aiAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  aiBubble: {
    flex: 1, backgroundColor: '#f4f4f8', borderRadius: 16, borderTopLeftRadius: 4,
    padding: 14,
  },

  reminderPill: {
    backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#7F77DD',
  },
  reminderPillPending: {
    backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#FFB800',
  },
  reminderPillTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  reminderPillTime: { fontSize: 12, color: '#7F77DD', marginTop: 2 },
  reminderPillPendingTime: { fontSize: 12, color: '#FFB800', marginTop: 2 },

  adviceText: { fontSize: 15, color: '#333', lineHeight: 22 },

  section: { marginTop: 12 },
  questionsHighlighted: {
    backgroundColor: '#FFF8E8', borderRadius: 10, padding: 10, marginTop: 12,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', marginBottom: 6,
  },
  sectionLabelUrgent: { color: '#E6A817' },

  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  checkboxChecked: { backgroundColor: '#7F77DD', borderColor: '#7F77DD' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 14, color: '#444' },

  questionText: { fontSize: 14, color: '#555', marginBottom: 4, lineHeight: 20 },
  nextStep: { marginTop: 10, fontSize: 13, color: '#888', fontStyle: 'italic' },

  replyRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10,
  },
  replyInput: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#222',
    maxHeight: 80,
  },
  replyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#7F77DD',
    alignItems: 'center', justifyContent: 'center',
  },
  replyBtnDisabled: { opacity: 0.35 },
  replyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  confirmBtn: {
    backgroundColor: '#1D9E75', padding: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
