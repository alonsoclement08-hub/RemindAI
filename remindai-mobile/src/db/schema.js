export const initSchema = `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'personal',
    scheduled_at TEXT,
    completed_at TEXT,
    archived_at TEXT,
    priority INTEGER DEFAULT 2,
    frequency TEXT DEFAULT 'once',
    frequency_days TEXT,
    next_occurrence TEXT,
    notify_before INTEGER,
    use_geolocation INTEGER DEFAULT 0,
    location_name TEXT,
    location_lat REAL,
    location_lng REAL,
    location_radius INTEGER DEFAULT 500,
    geo_notified INTEGER DEFAULT 0,
    context_ai TEXT,
    sync_status TEXT DEFAULT 'pending',
    deleted_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Migration: add columns to existing DB (no-op if already present)
  CREATE TABLE IF NOT EXISTS _migrations (key TEXT PRIMARY KEY);


  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    reminder_id TEXT NOT NULL,
    payload TEXT,
    priority INTEGER DEFAULT 2,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id TEXT,
    notification_id TEXT,
    title TEXT,
    body TEXT,
    type TEXT DEFAULT 'local',
    triggered_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_reminders_sync ON reminders(sync_status);
  CREATE INDEX IF NOT EXISTS idx_queue_status ON sync_queue(status);
  CREATE INDEX IF NOT EXISTS idx_queue_priority ON sync_queue(priority, created_at);
  CREATE INDEX IF NOT EXISTS idx_notif_reminder ON notification_history(reminder_id);
`;
