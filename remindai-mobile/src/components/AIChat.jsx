import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AIChat({ userMessage, response, onConfirm, onFollowUp, saving }) {
  const [checkedSuggestions, setCheckedSuggestions] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const toggleSuggestion = (i) =>
    setCheckedSuggestions((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const scheduledLabel = response?.reminder?.scheduledAt
    ? format(new Date(response.reminder.scheduledAt), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })
    : null;

  const handleConfirm = () => {
    const selected = (response?.suggestions ?? [])
      .filter((_, i) => checkedSuggestions.includes(i));
    onConfirm(response.reminder, selected);
  };

  const handleFollowUpSend = () => {
    if (!followUpText.trim()) return;
    onFollowUp(followUpText.trim());
    setFollowUpText('');
    setAskingFollowUp(false);
  };

  return (
    <View style={styles.container}>
      {/* User bubble */}
      <View style={styles.row}>
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
          {scheduledLabel && (
            <View style={styles.reminderPill}>
              <Text style={styles.reminderPillTitle}>{response.reminder.title}</Text>
              <Text style={styles.reminderPillTime}>{scheduledLabel}</Text>
            </View>
          )}

          <Text style={styles.adviceText}>{response?.advice}</Text>

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

          {response?.questions?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Questions</Text>
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

      {/* Actions */}
      {askingFollowUp ? (
        <View style={styles.followUpRow}>
          <TextInput
            style={styles.followUpInput}
            placeholder="Ta question..."
            placeholderTextColor="#bbb"
            value={followUpText}
            onChangeText={setFollowUpText}
            autoFocus
          />
          <Pressable style={styles.sendBtn} onPress={handleFollowUpSend}>
            <Text style={styles.sendBtnText}>Envoyer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
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
          <Pressable
            style={styles.followUpBtn}
            onPress={() => setAskingFollowUp(true)}
          >
            <Text style={styles.followUpBtnText}>Poser une question</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },

  row: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: {
    backgroundColor: '#7F77DD', borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%',
  },
  userText: { color: '#fff', fontSize: 15 },

  aiBubbleWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
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
  reminderPillTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  reminderPillTime: { fontSize: 12, color: '#7F77DD', marginTop: 2 },

  adviceText: { fontSize: 15, color: '#333', lineHeight: 22 },

  section: { marginTop: 12 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', marginBottom: 6,
  },

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

  actions: { gap: 10, marginTop: 4 },
  confirmBtn: {
    backgroundColor: '#1D9E75', padding: 15, borderRadius: 12, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  followUpBtn: {
    borderWidth: 1, borderColor: '#7F77DD', padding: 13, borderRadius: 12,
    alignItems: 'center',
  },
  followUpBtnText: { color: '#7F77DD', fontSize: 14, fontWeight: '600' },

  followUpRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  followUpInput: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#222',
  },
  sendBtn: {
    backgroundColor: '#7F77DD', paddingHorizontal: 16, borderRadius: 10,
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
