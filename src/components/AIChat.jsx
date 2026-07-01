import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QCMForm from './QCMForm';

const TIME_SLOTS = [
  { label: 'Matin', hour: 8 },
  { label: 'Midi', hour: 12 },
  { label: 'Après-midi', hour: 15 },
  { label: 'Soir', hour: 18 },
  { label: 'Ce soir', hour: 20 },
];

function buildScheduledAt(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export default function AIChat({
  userMessage,
  response,
  onConfirm,
  onFollowUp,
  onQCMAnswers,
  qcmAnswered = false,
  saving,
  loadingRecommendations,
  recommendations,
}) {
  const [replyText, setReplyText] = useState('');
  const [selectedHour, setSelectedHour] = useState(null);
  const [checkedSuggestions, setCheckedSuggestions] = useState([]);

  const hasQCM = !!response?.qcm;
  const hasRecommendations = !!recommendations;
  const missingInfo = response?.missingInfo === true || !response?.reminder?.scheduledAt;

  const scheduledLabel = response?.reminder?.scheduledAt
    ? format(new Date(response.reminder.scheduledAt), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })
    : null;

  const handleReplySend = () => {
    if (!replyText.trim()) return;
    onFollowUp(replyText.trim());
    setReplyText('');
  };

  const handleConfirmWithTime = () => {
    const reminder = { ...response.reminder };
    if (recommendations?.reminderTitle) reminder.title = recommendations.reminderTitle;
    if (selectedHour !== null) reminder.scheduledAt = buildScheduledAt(selectedHour);
    onConfirm(reminder);
  };

  const canConfirm = response?.reminder?.scheduledAt || selectedHour !== null;

  // ── QCM MODE ──────────────────────────────────────────────────────────────
  if (hasQCM && !qcmAnswered && !hasRecommendations && !loadingRecommendations) {
    return (
      <View style={styles.container}>
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{userMessage}</Text>
          </View>
        </View>
        <QCMForm qcm={response.qcm} onSubmit={onQCMAnswers} />
      </View>
    );
  }

  // ── LOADING RECOMMENDATIONS ───────────────────────────────────────────────
  if (loadingRecommendations) {
    return (
      <View style={styles.container}>
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{userMessage}</Text>
          </View>
        </View>
        <View style={styles.aiBubbleWrap}>
          <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>Rem</Text></View>
          <View style={styles.aiBubble}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#7F77DD" />
              <Text style={styles.loadingText}>Génération des conseils personnalisés...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── RECOMMENDATIONS MODE ──────────────────────────────────────────────────
  if (hasRecommendations) {
    const reco = recommendations;
    return (
      <View style={styles.container}>
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{userMessage}</Text>
          </View>
        </View>
        <View style={styles.aiBubbleWrap}>
          <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>Rem</Text></View>
          <View style={styles.aiBubble}>
            {reco.intro && <Text style={styles.adviceText}>{reco.intro}</Text>}

            {reco.recommendations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Recommandations</Text>
                {reco.recommendations.map((r, i) => (
                  <View key={i} style={styles.recoRow}>
                    <Text style={styles.recoNum}>{i + 1}</Text>
                    <View style={styles.recoContent}>
                      <Text style={styles.recoItem}>{r.item}</Text>
                      <Text style={styles.recoReason}>{r.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {reco.avoid && (
              <View style={styles.avoidBox}>
                <Text style={styles.avoidLabel}>À éviter</Text>
                <Text style={styles.avoidItem}>{reco.avoid.item}</Text>
                <Text style={styles.avoidReason}>{reco.avoid.reason}</Text>
              </View>
            )}

            {reco.tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {reco.tip}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Time picker */}
        <View style={styles.timePicker}>
          <Text style={styles.timePickerLabel}>À quelle heure veux-tu ce rappel ?</Text>
          <View style={styles.timeSlots}>
            {TIME_SLOTS.map((slot) => (
              <Pressable
                key={slot.hour}
                style={[styles.timeSlot, selectedHour === slot.hour && styles.timeSlotSelected]}
                onPress={() => setSelectedHour(slot.hour)}
              >
                <Text style={[styles.timeSlotText, selectedHour === slot.hour && styles.timeSlotTextSelected]}>
                  {slot.label}
                </Text>
                <Text style={[styles.timeSlotHour, selectedHour === slot.hour && styles.timeSlotTextSelected]}>
                  {slot.hour}h
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.confirmBtn, (!canConfirm || saving) && styles.btnDisabled]}
          onPress={handleConfirmWithTime}
          disabled={!canConfirm || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmBtnText}>
                Créer le rappel ✓
                {reco.reminderTitle ? `\n${reco.reminderTitle}` : ''}
              </Text>
          }
        </Pressable>
      </View>
    );
  }

  // ── STANDARD CHAT MODE (no QCM) ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{userMessage}</Text>
        </View>
      </View>

      <View style={styles.aiBubbleWrap}>
        <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>IA</Text></View>
        <View style={styles.aiBubble}>
          {scheduledLabel ? (
            <View style={styles.reminderPill}>
              <Text style={styles.reminderPillTitle}>{response?.reminder?.title}</Text>
              <Text style={styles.reminderPillTime}>{scheduledLabel}</Text>
            </View>
          ) : (
            <View style={styles.reminderPillPending}>
              <Text style={styles.reminderPillTitle}>{response?.reminder?.title}</Text>
              <Text style={styles.reminderPillPendingTime}>Heure non définie</Text>
            </View>
          )}

          {!!response?.advice && (
            <Text style={styles.adviceText}>{response.advice}</Text>
          )}

          {response?.suggestions?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Suggestions</Text>
              {response.suggestions.map((s, i) => (
                <Pressable
                  key={i}
                  style={styles.checkRow}
                  onPress={() =>
                    setCheckedSuggestions((prev) =>
                      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                    )
                  }
                >
                  <View style={[styles.checkbox, checkedSuggestions.includes(i) && styles.checkboxChecked]}>
                    {checkedSuggestions.includes(i) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkLabel}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

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

      {/* Reply input */}
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

      {(!missingInfo || qcmAnswered) && (
        <Pressable
          style={[styles.confirmBtn, saving && styles.btnDisabled]}
          onPress={() => onConfirm(response.reminder)}
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
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  aiBubble: {
    flex: 1, backgroundColor: '#f4f4f8', borderRadius: 16, borderTopLeftRadius: 4,
    padding: 14,
  },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#999', fontSize: 14 },

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

  recoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  recoNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#7F77DD',
    color: '#fff', fontSize: 12, fontWeight: '700',
    textAlign: 'center', lineHeight: 22, marginRight: 10, marginTop: 2,
  },
  recoContent: { flex: 1 },
  recoItem: { fontSize: 14, fontWeight: '700', color: '#222' },
  recoReason: { fontSize: 13, color: '#666', marginTop: 2 },

  avoidBox: {
    backgroundColor: '#FFF0F0', borderRadius: 10, padding: 10, marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: '#E0654A',
  },
  avoidLabel: { fontSize: 10, fontWeight: '700', color: '#E0654A', textTransform: 'uppercase', marginBottom: 4 },
  avoidItem: { fontSize: 14, fontWeight: '700', color: '#333' },
  avoidReason: { fontSize: 13, color: '#666', marginTop: 2 },

  tipBox: {
    backgroundColor: '#F0FFF7', borderRadius: 10, padding: 10, marginTop: 10,
  },
  tipText: { fontSize: 14, color: '#1D9E75', lineHeight: 20 },

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

  timePicker: { marginBottom: 14 },
  timePickerLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  timeSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  timeSlotSelected: { borderColor: '#7F77DD', backgroundColor: '#7F77DD' },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: '#555' },
  timeSlotHour: { fontSize: 11, color: '#999', marginTop: 2 },
  timeSlotTextSelected: { color: '#fff' },

  replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  replyInput: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#222', maxHeight: 80,
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
  btnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
