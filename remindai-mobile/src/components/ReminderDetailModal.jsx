import { useState, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { aiAPI } from '../api/ai';
import { exportReminderToCalendar } from '../utils/ics';
import { C, CAT, RADIUS, SP, SHADOW } from '../theme';

const CATEGORY_ICONS = { work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄', call: '📞' };
const CATEGORY_LABELS = { work: 'Travail', personal: 'Personnel', health: 'Santé', errand: 'Course', habit: 'Habitude', call: 'Appel' };
const PRIORITY_COLORS = { 1: '#b0b0b0', 2: '#FFB800', 3: '#FF8C42', 4: '#E0654A' };
const PRIORITY_LABELS = { 1: 'Faible', 2: 'Normal', 3: 'Haute', 4: 'Urgent' };

const LOCAL_ADVICE = {
  errand: "Comparez les prix avant d'acheter et vérifiez les promotions en cours. Privilégiez les produits locaux et de saison pour la meilleure qualité.",
  health: "N'oubliez pas de prendre vos médicaments avec un grand verre d'eau. Consultez votre médecin si vous avez le moindre doute.",
  work: "Préparez vos points clés à l'avance et arrivez en avance. La préparation est la moitié du travail.",
  personal: "Accordez-vous le temps nécessaire pour cette tâche. La qualité prime sur la vitesse.",
  habit: "La constance est la clé — même 5 minutes par jour font une grande différence sur le long terme.",
  call: "Notez les 3 points importants à aborder avant d'appeler. Ça rend l'échange plus efficace.",
};

const STUDY_KEYWORDS = ['révision', 'réviser', 'étudier', 'étude', 'examen', 'bac', 'devoir', 'contrôle', 'cours'];

const STUDY_ADVICE_ITEMS = [
  { label: '⏱ Pomodoro', text: '25 min de travail → 5 min de pause. Répète 4 fois puis grande pause. Garde ton téléphone hors de vue.' },
  { label: '🃏 Floka', text: 'Utilise Floka (gratuit) pour créer des flashcards sur les notions clés. Son algorithme te re-montre chaque carte au moment optimal pour ancrer la mémoire à long terme.' },
  { label: '🔁 Répétition espacée', text: 'Revois tes notes à intervalles croissants : ce soir → +1 jour → +3 jours → +1 semaine. Tu mémoriseras 3× plus vite qu\'en relisant tout la veille.' },
  { label: '🧠 Active recall', text: 'Ferme ton cours et teste-toi sur ce que tu sais. Ce que tu bloques = ce que tu dois retravailler. Plus efficace que relire passivement.' },
];

export default function ReminderDetailModal({ reminder, visible, onClose, onComplete, onSnooze, onEdit, onDelete }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le rappel',
      `Supprimer "${reminder.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => { onDelete?.(); onClose(); },
        },
      ]
    );
  };

  const handleExportCalendar = async () => {
    setExporting(true);
    try {
      await exportReminderToCalendar(reminder);
    } catch (err) {
      Alert.alert('Erreur', err?.message || 'Impossible d\'exporter');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!visible || !reminder) return;
    setAdvice(null);
    setLoading(true);
    aiAPI.getReminderAdvice(reminder.id)
      .then((res) => { setAdvice(res); })
      .finally(() => { setLoading(false); });
  }, [visible, reminder?.id]);

  if (!reminder) return null;

  const icon = CATEGORY_ICONS[reminder.category] || '📌';
  const catLabel = CATEGORY_LABELS[reminder.category] || reminder.category;
  const priorityColor = PRIORITY_COLORS[reminder.priority] || PRIORITY_COLORS[2];
  const priorityLabel = PRIORITY_LABELS[reminder.priority] || 'Normal';
  const catTheme = CAT[reminder.category] || CAT.personal;

  let timeLabel = null;
  if (reminder.scheduled_at) {
    const d = new Date(reminder.scheduled_at);
    if (isValid(d)) timeLabel = format(d, "EEEE d MMMM 'à' HH'h'mm", { locale: fr });
  }

  const titleLower = (reminder.title || '').toLowerCase();
  const isStudy = STUDY_KEYWORDS.some((w) => titleLower.includes(w));

  const localFallback = LOCAL_ADVICE[reminder.category] || LOCAL_ADVICE.personal;
  const adviceMessage = advice?.message || null;
  const actionItems = advice?.actionItems || [];
  const tone = advice?.tone || 'encouraging';

  const TONE_BORDER = { encouraging: catTheme.color, motivating: C.teal, advisory: C.amber, urgent: C.urgent };
  const borderColor = TONE_BORDER[tone] || catTheme.color;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>{icon}</Text>
            <View>
              <Text style={styles.headerCategory}>{catLabel}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '22', borderColor: priorityColor }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.title}>{reminder.title}</Text>
          {timeLabel && <Text style={styles.time}>🕐 {timeLabel}</Text>}
          {reminder.description ? (
            <Text style={styles.description}>{reminder.description}</Text>
          ) : null}

          {/* AI Note */}
          <View style={[styles.aiCard, { borderLeftColor: borderColor }]}>
            <View style={styles.aiHeader}>
              <View style={[styles.aiAvatar, { backgroundColor: borderColor }]}>
                <Text style={styles.aiAvatarText}>✦</Text>
              </View>
              <Text style={[styles.aiLabel, { color: borderColor }]}>Conseil IA</Text>
            </View>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#7F77DD" />
                <Text style={styles.loadingText}>Analyse de tes habitudes...</Text>
              </View>
            ) : adviceMessage ? (
              /* ── AI conversational message ── */
              <>
                <Text style={styles.adviceText}>{adviceMessage}</Text>
                {actionItems.length > 0 && (
                  <View style={styles.actionRow}>
                    {actionItems.slice(0, 2).map((item, i) => (
                      <View key={i} style={[styles.actionChip, { borderColor }]}>
                        <Text style={[styles.actionChipText, { color: borderColor }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : isStudy ? (
              /* ── Study offline fallback ── */
              <>
                <Text style={styles.adviceText}>
                  Voici les meilleures techniques pour réviser efficacement 📚
                </Text>
                {STUDY_ADVICE_ITEMS.map((item, i) => (
                  <View key={i} style={styles.studyItem}>
                    <Text style={styles.studyItemLabel}>{item.label}</Text>
                    <Text style={styles.studyItemText}>{item.text}</Text>
                  </View>
                ))}
                <Text style={styles.offlineNote}>💡 Connecte-toi pour un conseil personnalisé selon ta matière</Text>
              </>
            ) : (
              /* ── Generic offline fallback ── */
              <>
                <Text style={styles.adviceText}>{localFallback}</Text>
                <Text style={styles.offlineNote}>💡 Hors ligne — connecte-toi pour un conseil personnalisé</Text>
              </>
            )}
          </View>
        </ScrollView>

        {/* Actions row 1: snooze + complete */}
        <View style={styles.actions}>
          <Pressable style={styles.snoozeBtn} onPress={() => { onSnooze(60); onClose(); }}>
            <Text style={styles.snoozeBtnText}>💤 +1h</Text>
          </Pressable>
          <Pressable style={styles.snoozeBtn} onPress={() => { onSnooze(1440); onClose(); }}>
            <Text style={styles.snoozeBtnText}>💤 Demain</Text>
          </Pressable>
          <Pressable style={styles.completeBtn} onPress={() => { onComplete(); onClose(); }}>
            <Text style={styles.completeBtnText}>✓ Terminé</Text>
          </Pressable>
        </View>

        {/* Actions row 2: edit + delete + calendar */}
        <View style={styles.secondaryActions}>
          {onEdit && (
            <Pressable style={styles.editBtn} onPress={() => { onEdit(); onClose(); }}>
              <Text style={styles.editBtnText}>✏️ Modifier</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Supprimer</Text>
            </Pressable>
          )}
          {reminder.scheduled_at && (
            <Pressable
              style={[styles.calendarBtn, exporting && styles.calendarBtnDisabled]}
              onPress={handleExportCalendar}
              disabled={exporting}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#7F77DD" />
                : <Text style={styles.calendarBtnText}>📅 Calendrier</Text>
              }
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SP.xl, paddingTop: SP['2xl'], paddingBottom: SP.lg,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  headerIcon: { fontSize: 30 },
  headerCategory: {
    fontSize: 11, color: C.text3, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SP.xs,
  },
  priorityBadge: {
    alignSelf: 'flex-start', paddingHorizontal: SP.sm, paddingVertical: 2,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  priorityText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: C.text2 },

  body: { flex: 1, padding: SP.xl },

  title: {
    fontSize: 22, fontWeight: '800', color: C.text,
    lineHeight: 28, letterSpacing: -0.4, marginBottom: SP.sm,
  },
  time: { fontSize: 14, color: C.violet, fontWeight: '600', marginBottom: SP.xs },
  description: { fontSize: 15, color: C.text2, lineHeight: 22, marginBottom: SP.lg },

  aiCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: SP.lg,
    marginTop: SP.lg, borderLeftWidth: 3, borderLeftColor: C.violet,
    ...SHADOW.sm,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.md },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  aiLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingVertical: SP.sm },
  loadingText: { color: C.text3, fontSize: 14 },

  adviceText: { fontSize: 15, color: C.text2, lineHeight: 23 },

  section: { marginTop: SP.md },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.text4,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SP.sm,
  },
  bulletItem: { fontSize: 14, color: C.text2, lineHeight: 22, marginBottom: SP.xs },

  offlineNote: { marginTop: SP.md, fontSize: 12, color: C.text4, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginTop: SP.md },
  actionChip: {
    borderWidth: 1.5, borderRadius: RADIUS.pill,
    paddingHorizontal: SP.md, paddingVertical: 5,
  },
  actionChipText: { fontSize: 12, fontWeight: '600' },

  studyItem: {
    marginTop: SP.md, backgroundColor: C.violetSoft,
    borderRadius: RADIUS.md, padding: SP.md,
    borderLeftWidth: 3, borderLeftColor: C.violet,
  },
  studyItemLabel: { fontSize: 13, fontWeight: '800', color: C.violet, marginBottom: SP.xs },
  studyItemText: { fontSize: 13, color: C.text2, lineHeight: 20 },

  actions: {
    flexDirection: 'row', gap: SP.sm,
    paddingHorizontal: SP.xl, paddingTop: SP.md, paddingBottom: SP.sm,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
  },
  secondaryActions: {
    flexDirection: 'row', gap: SP.sm,
    paddingHorizontal: SP.xl, paddingBottom: SP.xl,
    backgroundColor: C.surface,
  },
  editBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.violet, borderRadius: RADIUS.md,
    paddingVertical: SP.md, alignItems: 'center', backgroundColor: C.violetSoft,
  },
  editBtnText: { fontSize: 13, color: C.violet, fontWeight: '600' },
  deleteBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.urgent, borderRadius: RADIUS.md,
    paddingVertical: SP.md, alignItems: 'center', backgroundColor: C.urgentSoft,
  },
  deleteBtnText: { fontSize: 13, color: C.urgent, fontWeight: '600' },
  calendarBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md,
    paddingVertical: SP.md, alignItems: 'center', backgroundColor: C.surface2,
    minHeight: 42, justifyContent: 'center',
  },
  calendarBtnDisabled: { opacity: 0.5 },
  calendarBtnText: { fontSize: 12, color: C.text2, fontWeight: '600' },
  snoozeBtn: {
    flex: 1, paddingVertical: SP.md, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
    backgroundColor: C.surface2,
  },
  snoozeBtnText: { fontSize: 14, color: C.text2, fontWeight: '600' },
  completeBtn: {
    flex: 2, paddingVertical: SP.md, borderRadius: RADIUS.md,
    backgroundColor: C.teal, alignItems: 'center',
    ...SHADOW.md(C.teal),
  },
  completeBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
