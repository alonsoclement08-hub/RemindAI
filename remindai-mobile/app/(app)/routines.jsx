import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRoutinesStore } from '../../src/store/routines.store';
import { localDB } from '../../src/db/sqlite';
import RoutineForm from '../../src/components/RoutineForm';

export default function RoutinesScreen() {
  const { routines, isLoading, load, remove, execute } = useRoutinesStore();
  const [formVisible, setFormVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [stepCounts, setStepCounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const loadStepCounts = useCallback(async (items) => {
    const counts = {};
    await Promise.all(
      items.map(async (r) => {
        const steps = await localDB.getRoutineSteps(r.id);
        counts[r.id] = steps.length;
      })
    );
    setStepCounts(counts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (routines.length > 0) {
        loadStepCounts(routines);
      }
    }, [routines])
  );

  const handleExecute = async (routine) => {
    const count = await execute(routine.id);
    Alert.alert(
      'Routine lancée',
      `${count} rappel${count > 1 ? 's' : ''} créé${count > 1 ? 's' : ''} !`
    );
  };

  const handleDelete = (routine) => {
    Alert.alert(
      'Supprimer la routine',
      `Supprimer "${routine.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => remove(routine.id),
        },
      ]
    );
  };

  const handleEdit = (routine) => {
    setEditingRoutine(routine);
    setFormVisible(true);
  };

  const handleCreate = () => {
    setEditingRoutine(null);
    setFormVisible(true);
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setEditingRoutine(null);
  };

  const handleSaved = () => {
    load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.stepCount}>
            {stepCounts[item.id] ?? '…'} étape{(stepCounts[item.id] ?? 0) > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.actionBtn, styles.executeBtn]}
          onPress={() => handleExecute(item)}
        >
          <Text style={styles.executeBtnText}>▶ Exécuter</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.editBtnText}>✏ Modifier</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mes Routines</Text>

      {routines.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⚡</Text>
          <Text style={styles.emptyTitle}>Aucune routine</Text>
          <Text style={styles.emptySubtitle}>
            Créez des séquences de rappels pour automatiser vos habitudes
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable style={styles.fab} onPress={handleCreate}>
        <Text style={styles.fabText}>+ Créer une routine</Text>
      </Pressable>

      <RoutineForm
        visible={formVisible}
        routine={editingRoutine}
        onClose={handleFormClose}
        onSaved={handleSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { marginBottom: 12 },
  cardInfo: { gap: 4 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#222' },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  stepCount: { fontSize: 12, color: '#7F77DD', fontWeight: '600', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeBtn: { backgroundColor: '#1D9E75', flex: 1 },
  executeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  editBtn: { backgroundColor: '#f0eeff', flex: 1 },
  editBtnText: { color: '#7F77DD', fontWeight: '700', fontSize: 14 },
  deleteBtn: { backgroundColor: '#fff2f0', borderWidth: 1, borderColor: '#ffd8d4' },
  deleteBtnText: { fontSize: 16 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptySubtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: '#7F77DD',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#7F77DD',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
