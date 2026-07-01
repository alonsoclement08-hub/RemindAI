import { create } from 'zustand';
import { localDB } from '../db/sqlite';
import { useRemindersStore } from './reminders.store';

export const useRoutinesStore = create((set, get) => ({
  routines: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const routines = await localDB.getRoutines();
      set({ routines });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await localDB.createRoutine({
      id,
      name: data.name,
      description: data.description || null,
    });
    if (Array.isArray(data.steps)) {
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const stepId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}_${i}`;
        await localDB.createRoutineStep({
          id: stepId,
          routine_id: id,
          step_order: i,
          title: step.title,
          category: step.category || 'personal',
          priority: step.priority ?? 2,
          delay_minutes: step.delayMinutes ?? 0,
          condition: step.condition || 'always',
        });
      }
    }
    await get().load();
    return id;
  },

  update: async (id, data) => {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (Object.keys(updates).length > 0) {
      await localDB.updateRoutine(id, updates);
    }
    if (Array.isArray(data.steps)) {
      await localDB.deleteRoutineSteps(id);
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const stepId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}_${i}`;
        await localDB.createRoutineStep({
          id: stepId,
          routine_id: id,
          step_order: i,
          title: step.title,
          category: step.category || 'personal',
          priority: step.priority ?? 2,
          delay_minutes: step.delayMinutes ?? 0,
          condition: step.condition || 'always',
        });
      }
    }
    await get().load();
  },

  remove: async (id) => {
    await localDB.deleteRoutine(id);
    await get().load();
  },

  execute: async (routineId) => {
    const steps = await localDB.getRoutineSteps(routineId);
    const remindersStore = useRemindersStore.getState();
    for (const step of steps) {
      await remindersStore.create({
        title: step.title,
        category: step.category || 'personal',
        priority: step.priority ?? 2,
        scheduled_at: new Date(Date.now() + (step.delay_minutes || 0) * 60000).toISOString(),
      });
    }
    return steps.length;
  },
}));
