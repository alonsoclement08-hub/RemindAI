import { useState } from 'react';
import {
  View, Text, SectionList, Pressable, StyleSheet, Animated,
} from 'react-native';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemindersStore } from '../store/reminders.store';

const FREQ_LABELS = {
  once: '',
  daily: '🔄 Quotidien',
  weekly: '🔄 Hebdomadaire',
  monthly: '🔄 Mensuel',
  custom: '🔄 Personnalisé',
};

const PRIORITY_COLORS = { 1: '#b0b0b0', 2: '#FFB800', 3: '#FF8C42', 4: '#E0654A' };
const CATEGORY_ICONS = { work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄', call: '📞' };

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (!isValid(d)) return '';
  return format(d, "d MMM · HH'h'mm", { locale: fr });
}

function ReminderRow({ reminder, onComplete, onEdit, onDelete, onRestore, section }) {
  const isPending = section === 'pending';
  const isArchived = section === 'archived';
  const icon = CATEGORY_ICONS[reminder.category] || '📌';
  const priorityColor = PRIORITY_COLORS[reminder.priority] || PRIORITY_COLORS[2];
  const freqLabel = FREQ_LABELS[reminder.frequency] || '';

  return (
    <View style={styles.row}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      {isPending && (
        <Pressable
          style={styles.checkWrap}
          onPress={() => onComplete(reminder.id)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          testID={`complete-${reminder.id}`}
        >
          <View style={styles.checkCircle} />
        </Pressable>
      )}

      {!isPending && (
        <View style={styles.checkWrap}>
          <View style={[styles.checkCircle, section === 'completed' && styles.checkCircleDone]}>
            {section === 'completed' && <Text style={styles.checkMark}>✓</Text>}
            {isArchived && <Text style={styles.archiveMark}>•</Text>}
          </View>
        </View>
      )}

      <Pressable style={styles.rowContent} onPress={() => !isArchived && onEdit(reminder)}>
        <Text style={[styles.rowTitle, !isPending && styles.rowTitleDone]} numberOfLines={2}>
          {icon} {reminder.title}
        </Text>
        <View style={styles.rowMeta}>
          {reminder.scheduled_at ? (
            <Text style={styles.rowTime}>{formatDate(reminder.scheduled_at)}</Text>
          ) : null}
          {freqLabel ? <Text style={styles.rowFreq}>{freqLabel}</Text> : null}
        </View>
      </Pressable>

      <View style={styles.rowActions}>
        {isPending && (
          <Pressable style={styles.actionBtn} onPress={() => onEdit(reminder)}>
            <Text style={styles.actionBtnText}>✎</Text>
          </Pressable>
        )}
        {isArchived && (
          <Pressable style={[styles.actionBtn, styles.restoreBtn]} onPress={() => onRestore(reminder.id)}>
            <Text style={styles.restoreBtnText}>↩</Text>
          </Pressable>
        )}
        <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(reminder.id)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RemindersList({ onEdit }) {
  const { getSections, complete, remove, archive, restore } = useRemindersStore();
  const { pending, completed, archived } = getSections();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = (id) => {
    if (deletingId === id) {
      remove(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId((cur) => (cur === id ? null : cur)), 3000);
    }
  };

  const sections = [
    pending.length > 0 && { title: 'EN ATTENTE', data: pending, key: 'pending' },
    completed.length > 0 && { title: 'TERMINÉS', data: completed, key: 'completed' },
    archived.length > 0 && { title: 'ARCHIVÉS', data: archived, key: 'archived' },
  ].filter(Boolean);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyText}>Aucun rappel pour l'instant</Text>
        <Text style={styles.emptySubText}>Appuyez sur + pour en créer un</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      )}
      renderItem={({ item, section }) => (
        <View>
          <ReminderRow
            reminder={item}
            section={section.key}
            onComplete={complete}
            onEdit={onEdit}
            onDelete={handleDelete}
            onRestore={restore}
          />
          {deletingId === item.id && (
            <View style={styles.confirmDelete}>
              <Text style={styles.confirmDeleteText}>Confirmer la suppression?</Text>
              <Pressable onPress={() => remove(item.id)} style={styles.confirmDeleteBtn}>
                <Text style={styles.confirmDeleteBtnText}>Supprimer</Text>
              </Pressable>
              <Pressable onPress={() => setDeletingId(null)} style={styles.confirmCancelBtn}>
                <Text style={styles.confirmCancelText}>Annuler</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 80 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, marginTop: 16,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#999', letterSpacing: 1 },
  sectionCount: {
    fontSize: 11, fontWeight: '700', color: '#fff',
    backgroundColor: '#ccc', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  priorityBar: { width: 3, height: 36, borderRadius: 2, marginRight: 8 },
  checkWrap: { marginRight: 10 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
  },
  checkCircleDone: { borderColor: '#1D9E75', backgroundColor: '#1D9E75' },
  checkMark: { fontSize: 11, color: '#fff', fontWeight: '700' },
  archiveMark: { fontSize: 11, color: '#aaa', fontWeight: '700' },

  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  rowTitleDone: { color: '#aaa', textDecorationLine: 'line-through' },
  rowMeta: { flexDirection: 'row', gap: 8, marginTop: 3 },
  rowTime: { fontSize: 11, color: '#7F77DD', fontWeight: '500' },
  rowFreq: { fontSize: 11, color: '#1D9E75', fontWeight: '500' },

  rowActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 14, color: '#555' },
  deleteBtn: { backgroundColor: '#fff0f0' },
  deleteBtnText: { fontSize: 12, color: '#E0654A', fontWeight: '700' },
  restoreBtn: { backgroundColor: '#f0fff8' },
  restoreBtnText: { fontSize: 14, color: '#1D9E75', fontWeight: '700' },

  confirmDelete: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5',
    borderRadius: 10, padding: 10, marginBottom: 8, gap: 8,
  },
  confirmDeleteText: { flex: 1, fontSize: 13, color: '#E0654A' },
  confirmDeleteBtn: {
    backgroundColor: '#E0654A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  confirmDeleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  confirmCancelBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  confirmCancelText: { fontSize: 12, color: '#999' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#999' },
});
