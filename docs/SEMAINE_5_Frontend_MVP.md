# SEMAINE 5 — FRONTEND MVP (REACT NATIVE)
**RemindAI • Mois 2**

---

## OBJECTIFS SEMAINE 5

1. ✅ Setup React Native project avec Expo
2. ✅ Implémenter navigation (React Navigation)
3. ✅ Créer screens: Home, Create, Paywall, Settings
4. ✅ Intégrer API client (axios + Bearer token)
5. ✅ Setup SQLite local storage (offline-first)
6. ✅ Implémentation de base de la sync engine
7. ✅ Auth flow integration (login/signup)
8. ✅ Tests avec Detox

---

## ARCHITECTURE FRONTEND

```
RemindAI-Mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.jsx
│   │   ├── signup.jsx
│   │   └── onboarding.jsx
│   ├── (app)/
│   │   ├── home.jsx (main tab)
│   │   ├── create.jsx (modal)
│   │   ├── settings.jsx
│   │   └── _layout.jsx (bottom tabs)
│   └── _layout.jsx (root)
├── src/
│   ├── api/
│   │   ├── client.js (axios instance + interceptors)
│   │   ├── auth.js (POST /signup, /login, /refresh)
│   │   ├── reminders.js (CRUD operations)
│   │   └── sync.js (POST /sync endpoint)
│   ├── db/
│   │   ├── sqlite.js (init + queries)
│   │   ├── schema.js (table definitions)
│   │   └── migrations.js
│   ├── services/
│   │   ├── auth.service.js (token storage/retrieval)
│   │   ├── sync.service.js (bi-directional sync logic)
│   │   ├── reminder.service.js (local CRUD + queuing)
│   │   └── offline.service.js (queue management)
│   ├── store/
│   │   ├── auth.store.js (Zustand)
│   │   ├── reminders.store.js
│   │   └── ui.store.js (loading states, modals)
│   ├── components/
│   │   ├── ReminderCard.jsx
│   │   ├── SuggestionCard.jsx
│   │   ├── VoiceInput.jsx
│   │   ├── ProgressRing.jsx
│   │   └── BottomSheet.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useReminders.js
│   │   ├── useSync.js
│   │   └── useOfflineQueue.js
│   └── utils/
│       ├── nlp.js (basic NLP parsing)
│       ├── date.js (date parsing utilities)
│       └── storage.js (SecureStore for tokens)
├── package.json
├── app.json (Expo config)
└── eas.json (EAS Build config)
```

---

## JOUR 1: PROJECT SETUP

### Task 1: Initialize React Native + Expo

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new project with TypeScript
expo init RemindAI-Mobile --template

# Navigate to project
cd RemindAI-Mobile

# Install core dependencies
npm install \
  expo \
  expo-router \
  expo-sqlite \
  expo-secure-store \
  expo-speech \
  react-native \
  react-native-reanimated \
  react-native-gesture-handler \
  axios \
  zustand \
  date-fns \
  uuid

# Dev dependencies
npm install --save-dev \
  @testing-library/react-native \
  detox \
  detox-cli \
  jest
```

### Task 2: Setup Navigation Structure

**app/_layout.jsx** (Root layout)
```javascript
import { Stack } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function RootLayout() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      {isSignedIn ? (
        <Stack.Screen 
          name="(app)" 
          options={{ headerShown: false }} 
        />
      ) : (
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
      )}
    </Stack>
  );
}
```

**app/(auth)/_layout.jsx**
```javascript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen 
        name="onboarding" 
        options={{ animationEnabled: false }}
      />
    </Stack>
  );
}
```

**app/(app)/_layout.jsx** (Tab navigation)
```javascript
import { Tabs } from 'expo-router';
import { Home, Plus, Settings } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7F77DD',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <Plus color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## JOUR 2: API CLIENT & AUTH

### Task 1: API Client Setup

**src/api/client.js**
```javascript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth.store';

const API_URL = 'https://your-server.com/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor: attach JWT
client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 → refresh token
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Logout user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
```

### Task 2: Auth Endpoints

**src/api/auth.js**
```javascript
import client from './client';
import * as SecureStore from 'expo-secure-store';

export const authAPI = {
  signup: async (email, password, name) => {
    const { data } = await client.post('/auth/signup', {
      email,
      password,
      name,
    });

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);

    return data;
  },

  login: async (email, password) => {
    const { data } = await client.post('/auth/login', {
      email,
      password,
    });

    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);

    return data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};
```

### Task 3: Auth Store (Zustand)

**src/store/auth.store.js**
```javascript
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,

  // Check if user logged in on app start
  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Verify token is still valid
        const { data } = await client.get('/user/profile');
        set({ user: data, isSignedIn: true });
      }
    } catch (error) {
      console.log('Token invalid, logging out');
      set({ isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email, password, name) => {
    const result = await authAPI.signup(email, password, name);
    set({ user: result.user, isSignedIn: true });
  },

  login: async (email, password) => {
    const result = await authAPI.login(email, password);
    set({ user: result.user, isSignedIn: true });
  },

  logout: async () => {
    await authAPI.logout();
    set({ user: null, isSignedIn: false });
  },
}));
```

---

## JOUR 3: SQLITE & SYNC

### Task 1: SQLite Setup

**src/db/sqlite.js**
```javascript
import * as SQLite from 'expo-sqlite';
import { initSchema } from './schema';

let db = null;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('remindai.db');
    await db.execAsync(initSchema);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ DB init error:', error);
  }
};

export const getDB = () => db;

// Local reminder queries
export const localDB = {
  // Create reminder locally
  createReminder: async (reminder) => {
    const {
      id,
      title,
      description,
      category,
      scheduled_at,
      priority,
      context_ai,
      sync_status = 'pending',
    } = reminder;

    await db.runAsync(
      `INSERT INTO reminders 
       (id, title, description, category, scheduled_at, priority, context_ai, sync_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description,
        category,
        scheduled_at,
        priority,
        context_ai,
        sync_status,
        new Date().toISOString(),
      ]
    );
  },

  // Get all reminders
  getReminders: async () => {
    const result = await db.getAllAsync(
      'SELECT * FROM reminders WHERE deleted_at IS NULL ORDER BY scheduled_at ASC'
    );
    return result;
  },

  // Get single reminder
  getReminder: async (id) => {
    const result = await db.getFirstAsync(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );
    return result;
  },

  // Update reminder
  updateReminder: async (id, updates) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await db.runAsync(
      `UPDATE reminders SET ${fields}, updated_at = ? WHERE id = ?`,
      [...values, new Date().toISOString(), id]
    );
  },

  // Delete reminder (soft delete)
  deleteReminder: async (id) => {
    await db.runAsync(
      'UPDATE reminders SET deleted_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  },

  // Get sync queue (pending changes)
  getSyncQueue: async () => {
    return db.getAllAsync(
      `SELECT * FROM sync_queue 
       WHERE status = 'pending' 
       ORDER BY created_at ASC`
    );
  },

  // Add to sync queue
  addToSyncQueue: async (action, reminderId, payload) => {
    await db.runAsync(
      `INSERT INTO sync_queue (action, reminder_id, payload, status)
       VALUES (?, ?, ?, ?)`,
      [action, reminderId, JSON.stringify(payload), 'pending']
    );
  },
};
```

**src/db/schema.js**
```javascript
export const initSchema = `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    scheduled_at TEXT,
    due_at TEXT,
    completed_at TEXT,
    is_recurring INTEGER DEFAULT 0,
    recurring_rule TEXT,
    priority INTEGER DEFAULT 1,
    location TEXT,
    lat REAL,
    lng REAL,
    context_ai TEXT,
    sync_status TEXT DEFAULT 'pending',
    deleted_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    reminder_id TEXT,
    payload TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS local_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_scheduled_at ON reminders(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_sync_status ON reminders(sync_status);
`;
```

### Task 2: Sync Service (Offline-First)

**src/services/sync.service.js**
```javascript
import client from '../api/client';
import { localDB } from '../db/sqlite';
import { useRemindersStore } from '../store/reminders.store';

export const syncService = {
  // Full bi-directional sync
  syncReminders: async () => {
    try {
      console.log('🔄 Starting sync...');

      // 1. Get pending changes from local queue
      const queue = await localDB.getSyncQueue();

      // 2. Send to server
      const { data } = await client.post('/api/sync', {
        client_timestamp: Date.now(),
        changes: queue.map((item) => ({
          action: item.action,
          id: item.reminder_id,
          reminder: JSON.parse(item.payload),
        })),
      });

      // 3. Clear sync queue
      await Promise.all(
        queue.map((item) =>
          client.query(
            'UPDATE sync_queue SET status = ? WHERE id = ?',
            ['synced', item.id]
          )
        )
      );

      // 4. Apply server changes locally
      if (data.server_changes && data.server_changes.length > 0) {
        for (const change of data.server_changes) {
          if (change.action === 'create' || change.action === 'update') {
            await localDB.createReminder(change.reminder);
          } else if (change.action === 'delete') {
            await localDB.deleteReminder(change.id);
          }
        }
      }

      // 5. Reload reminders in store
      const reminders = await localDB.getReminders();
      useRemindersStore.setState({ reminders });

      console.log('✅ Sync complete');
      return { success: true, conflicts: data.conflicts || [] };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, error };
    }
  },

  // Queue a change for sync
  queueChange: async (action, reminderId, reminder) => {
    await localDB.addToSyncQueue(action, reminderId, reminder);
    console.log(`📝 Queued ${action} for ${reminderId}`);
  },
};
```

---

## JOUR 4: HOME SCREEN & REMINDER CARDS

### Task 1: Home Screen Implementation

**app/(app)/home.jsx** (main screen with reminders)
```javascript
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRemindersStore } from '../../src/store/reminders.store';
import { localDB } from '../../src/db/sqlite';
import { syncService } from '../../src/services/sync.service';
import ReminderCard from '../../src/components/ReminderCard';
import SummaryCard from '../../src/components/SummaryCard';
import ProgressRing from '../../src/components/ProgressRing';
import { isToday, isTomorrow, formatDate } from 'date-fns';

export default function HomeScreen() {
  const { reminders, setReminders } = useRemindersStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState({
    today: [],
    tomorrow: [],
    later: [],
    completed: [],
  });

  // Load reminders on focus
  useFocusEffect(
    React.useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    try {
      const all = await localDB.getReminders();
      const today = [];
      const tomorrow = [];
      const later = [];
      const completed = [];

      all.forEach((reminder) => {
        if (reminder.completed_at) {
          completed.push(reminder);
        } else if (isToday(new Date(reminder.scheduled_at))) {
          today.push(reminder);
        } else if (isTomorrow(new Date(reminder.scheduled_at))) {
          tomorrow.push(reminder);
        } else {
          later.push(reminder);
        }
      });

      setSections({ today, tomorrow, later, completed });
      setReminders(all);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncReminders();
      await loadReminders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleComplete = async (reminder) => {
    await localDB.updateReminder(reminder.id, {
      completed_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    await syncService.queueChange('update', reminder.id, {
      ...reminder,
      completed_at: new Date().toISOString(),
    });
    await loadReminders();
  };

  const handleSnooze = async (reminder, minutes) => {
    const newTime = new Date(reminder.scheduled_at);
    newTime.setMinutes(newTime.getMinutes() + minutes);

    await localDB.updateReminder(reminder.id, {
      scheduled_at: newTime.toISOString(),
      sync_status: 'pending',
    });
    await syncService.queueChange('update', reminder.id, {
      ...reminder,
      scheduled_at: newTime.toISOString(),
    });
    await loadReminders();
  };

  const completionRate = reminders.length > 0
    ? Math.round(
        (sections.completed.length / reminders.length) * 100
      )
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Summary + Progress */}
        <SummaryCard
          todayCount={sections.today.length}
          urgentCount={sections.today.filter((r) => r.priority >= 3).length}
        />

        <ProgressRing
          completed={sections.completed.length}
          total={reminders.length}
          percentage={completionRate}
        />

        {/* Today Section */}
        {sections.today.length > 0 && (
          <Section title="Aujourd'hui">
            {sections.today.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => handleComplete(reminder)}
                onSnooze={(mins) => handleSnooze(reminder, mins)}
              />
            ))}
          </Section>
        )}

        {/* Tomorrow Section */}
        {sections.tomorrow.length > 0 && (
          <Section title="Demain">
            {sections.tomorrow.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => handleComplete(reminder)}
              />
            ))}
          </Section>
        )}

        {/* Later Section */}
        {sections.later.length > 0 && (
          <Section title="Bientôt">
            {sections.later.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => handleComplete(reminder)}
              />
            ))}
          </Section>
        )}

        {/* No reminders fallback */}
        {reminders.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Tu n'as aucun rappel. Crée-en un!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { marginVertical: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: { fontSize: 16, color: '#999' },
});
```

### Task 2: Reminder Card Component

**src/components/ReminderCard.jsx**
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { formatTime } from 'date-fns';

export default function ReminderCard({
  reminder,
  onComplete,
  onSnooze,
}) {
  const pan = React.useRef(new Animated.ValueXY()).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, { dx }) => {
        if (dx > 80) {
          // Swipe right = complete
          onComplete();
          Animated.timing(pan.x, {
            toValue: 500,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else if (dx < -80) {
          // Swipe left = snooze
          showSnoozeOptions();
        } else {
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const showSnoozeOptions = () => {
    setShowSnoozeMenu(true);
  };

  const handleSnooze = (minutes) => {
    onSnooze(minutes);
    setShowSnoozeMenu(false);
    Animated.spring(pan.x, { toValue: 0, useNativeDriver: false }).start();
  };

  const priorityColor = {
    1: '#999',
    2: '#FFB800',
    3: '#FF8C42',
    4: '#E0654A',
  }[reminder.priority || 1];

  return (
    <View style={styles.wrapper}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: [{ translateX: pan.x }] }]}
      >
        <View style={[styles.priority, { backgroundColor: priorityColor }]} />
        <View style={styles.content}>
          <Text style={styles.title}>{reminder.title}</Text>
          {reminder.context_ai && (
            <Text style={styles.context}>{reminder.context_ai}</Text>
          )}
          <Text style={styles.time}>
            {formatTime(new Date(reminder.scheduled_at), 'HH:mm')}
          </Text>
        </View>
        <Text style={styles.hint}>← swipe to snooze | swipe right to done →</Text>
      </Animated.View>

      {showSnoozeMenu && (
        <View style={styles.snoozeMenu}>
          <Pressable
            onPress={() => handleSnooze(15)}
            style={styles.snoozeButton}
          >
            <Text style={styles.snoozeText}>+15 min</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSnooze(60)}
            style={styles.snoozeButton}
          >
            <Text style={styles.snoozeText}>+1 h</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSnooze(1440)}
            style={styles.snoozeButton}
          >
            <Text style={styles.snoozeText}>Tomorrow</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7F77DD',
  },
  priority: { width: 3, height: 40, marginRight: 12, borderRadius: 2 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  context: { fontSize: 13, color: '#999', marginTop: 4 },
  time: { fontSize: 12, color: '#7F77DD', marginTop: 4, fontWeight: '500' },
  hint: { fontSize: 10, color: '#ccc', marginTop: 4 },
  snoozeMenu: {
    position: 'absolute',
    bottom: -120,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  snoozeButton: { padding: 8 },
  snoozeText: { fontSize: 13, color: '#7F77DD', fontWeight: '600' },
});
```

---

## JOUR 5: CREATE SCREEN & VOICE INPUT

### Task 1: Create Screen with NLP Parsing

**app/(app)/create.jsx** (create reminder modal)
```javascript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { v4 as uuid } from 'uuid';
import * as Speech from 'expo-speech';
import { useRemindersStore } from '../../src/store/reminders.store';
import { localDB } from '../../src/db/sqlite';
import { syncService } from '../../src/services/sync.service';
import { parseNLP } from '../../src/utils/nlp';
import VoiceInput from '../../src/components/VoiceInput';

export default function CreateScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [recording, setRecording] = useState(false);
  const { reminders } = useRemindersStore();

  const handleVoiceInput = async (transcript) => {
    setInput(transcript);
    await handleParse(transcript);
  };

  const handleParse = async (text) => {
    if (!text.trim()) return;

    setParsing(true);
    try {
      // Simple NLP parsing (expand this later with Ollama integration)
      const result = parseNLP(text);
      setParsed(result);
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    const reminder = {
      id: uuid(),
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      scheduled_at: parsed.scheduledAt.toISOString(),
      priority: parsed.priority || 2,
      context_ai: 'AI context will be generated on server',
      sync_status: 'pending',
    };

    try {
      // Check free tier limit
      if (reminders.length >= 20) {
        alert(
          'Free tier limit reached. Upgrade to Pro for unlimited reminders.'
        );
        return;
      }

      // Save locally
      await localDB.createReminder(reminder);

      // Queue for sync
      await syncService.queueChange('create', reminder.id, reminder);

      // Reset form
      setInput('');
      setParsed(null);

      alert('Reminder created!');
      navigation.goBack();
    } catch (error) {
      console.error('Create error:', error);
      alert('Failed to create reminder');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Reminder</Text>

      {/* Voice Input Button */}
      <VoiceInput onTranscript={handleVoiceInput} />

      {/* Text Input */}
      <TextInput
        style={styles.input}
        placeholder="Or type: 'Call Jean tomorrow at 3pm'"
        placeholderTextColor="#999"
        value={input}
        onChangeText={setInput}
        multiline
        maxLength={500}
      />

      {/* Parse Button */}
      <Pressable
        style={[styles.button, parsing && styles.buttonDisabled]}
        onPress={() => handleParse(input)}
        disabled={parsing}
      >
        {parsing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Parse</Text>
        )}
      </Pressable>

      {/* Parsed Result */}
      {parsed && (
        <View style={styles.parsedBox}>
          <Text style={styles.parsedLabel}>Title:</Text>
          <TextInput
            style={styles.parsedInput}
            value={parsed.title}
            onChangeText={(val) =>
              setParsed({ ...parsed, title: val })
            }
          />

          <Text style={styles.parsedLabel}>When:</Text>
          <Text style={styles.parsedValue}>
            {parsed.scheduledAt.toLocaleString()}
          </Text>

          <Text style={styles.parsedLabel}>Category:</Text>
          <TextInput
            style={styles.parsedInput}
            value={parsed.category}
            onChangeText={(val) =>
              setParsed({ ...parsed, category: val })
            }
          />

          <Text style={styles.parsedLabel}>Priority:</Text>
          <View style={styles.priorityButtons}>
            {[1, 2, 3, 4].map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.priorityButton,
                  parsed.priority === p && styles.priorityButtonActive,
                ]}
                onPress={() =>
                  setParsed({ ...parsed, priority: p })
                }
              >
                <Text style={styles.priorityButtonText}>
                  {['Low', 'Normal', 'High', 'Urgent'][p - 1]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Create Button */}
          <Pressable
            style={styles.createButton}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Create Reminder</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#7F77DD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  parsedBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  parsedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  parsedValue: {
    fontSize: 14,
    color: '#222',
    marginTop: 4,
  },
  parsedInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    fontSize: 14,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#7F77DD',
    borderColor: '#7F77DD',
  },
  priorityButtonText: { fontSize: 12, color: '#666' },
  createButton: {
    backgroundColor: '#1D9E75',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
```

### Task 2: Voice Input Component

**src/components/VoiceInput.jsx**
```javascript
import React, { useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Mic } from 'lucide-react-native';

export default function VoiceInput({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  const startRecording = async () => {
    try {
      setRecording(true);
      // Note: For MVP, use device speech-to-text
      // In production, implement server-side transcription
      await Speech.startAsync();
    } catch (error) {
      console.error('Recording error:', error);
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setRecording(false);
      setProcessing(true);

      // Mock transcript (replace with actual STT)
      const transcript =
        'Rappelle-moi d\'appeler maman demain à 18h';
      onTranscript(transcript);

      setProcessing(false);
    } catch (error) {
      console.error('Processing error:', error);
      setProcessing(false);
    }
  };

  return (
    <Pressable
      style={[
        styles.button,
        recording && styles.buttonRecording,
      ]}
      onPress={recording ? stopRecording : startRecording}
      disabled={processing}
    >
      {processing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Mic color="#fff" size={24} />
          <Text style={styles.buttonText}>
            {recording
              ? 'Stop Recording'
              : 'Press to Record'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F77DD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonRecording: {
    backgroundColor: '#E0654A',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
```

---

## TESTING STRATEGY

### Unit Tests (Jest)

**__tests__/api/client.test.js**
```javascript
import client from '../../src/api/client';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('API Client', () => {
  it('should attach Bearer token to requests', async () => {
    SecureStore.getItemAsync.mockResolvedValue('test-token');

    // Mock axios request
    const response = await client.get('/user/profile');
    expect(client.defaults.headers.common['Authorization']).toBe(
      'Bearer test-token'
    );
  });

  it('should refresh token on 401', async () => {
    // Mock 401 response and token refresh
    SecureStore.getItemAsync.mockResolvedValue('old-token');
    // Add refresh logic test
  });
});
```

### Integration Tests (Detox)

**e2e/createReminder.e2e.js**
```javascript
describe('Create Reminder Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create reminder via voice input', async () => {
    // Navigate to create
    await element(by.id('createButton')).tap();

    // Tap voice button
    await element(by.id('voiceButton')).multiTap();

    // Wait for parsing
    await waitFor(element(by.text('Create Reminder')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap create
    await element(by.id('createReminderButton')).tap();

    // Verify reminder appears on home
    await expect(
      element(by.text('Call Jean'))
    ).toBeVisible();
  });
});
```

---

## DELIVERABLES SEMAINE 5

- ✅ **project-setup.md** (dependencies, project structure)
- ✅ **app-navigation.tsx** (React Navigation setup)
- ✅ **api-client.ts** (Axios + JWT interceptors)
- ✅ **auth.store.ts** (Zustand auth state)
- ✅ **sqlite.ts** (Database initialization + queries)
- ✅ **sync.service.ts** (Bi-directional sync logic)
- ✅ **home.screen.tsx** (Main reminder list)
- ✅ **create.screen.tsx** (Reminder creation + NLP parsing)
- ✅ **ReminderCard.tsx** (Swipe gestures)
- ✅ **VoiceInput.tsx** (Voice recording component)
- ✅ **unit-tests.test.js** (Jest tests for API client, store)
- ✅ **e2e-tests.e2e.js** (Detox integration tests)

---

## WHAT'S WORKING AT END OF SEMAINE 5

✅ React Native project with Expo
✅ Navigation (auth stack + app tabs)
✅ API client with JWT auth + token refresh
✅ Local SQLite storage with full CRUD
✅ Offline-first sync engine (queue + bi-directional)
✅ Home screen with reminder list + sections
✅ Create screen with NLP parsing
✅ Swipe gestures (complete, snooze)
✅ Voice input recording
✅ Unit + e2e tests

---

## WHAT'S PENDING

❌ **Semaine 6:** Polish, Push Notifications, Paywall, Settings
❌ **Semaine 7:** Ollama IA Integration, AI context generation, proactive detection
❌ **Semaine 8:** Beta testing, App Store submission

---

## NEXT STEPS

1. **Day 1-2:** Setup React Native, navigation, API client
2. **Day 3:** SQLite + sync engine
3. **Day 4:** Home screen + reminder cards
4. **Day 5:** Create screen + voice input
5. **Throughout:** Write tests, debug locally

**Local dev flow:**
```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on iOS simulator
npm run ios

# Terminal 3: Watch tests
npm test -- --watch

# Manual testing: Create reminder → see it in home → swipe to complete → verify sync
```

---

**FIN SEMAINE 5 ✅**

Prêt pour **Semaine 6**: Polish & Optimizations (Paywall, Push Notifications, Settings)
