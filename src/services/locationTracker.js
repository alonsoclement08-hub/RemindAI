import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import client from '../api/client';

let _subscription = null;
let _lastCheck = 0;
const CHECK_COOLDOWN_MS = 30000; // avoid hammering the server

async function requestPermissions() {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  // Background permissions improve reliability but are optional
  try {
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === 'granted' || fg === 'granted';
  } catch {
    return true; // foreground-only is still useful
  }
}

async function handlePosition(coords) {
  const now = Date.now();
  if (now - _lastCheck < CHECK_COOLDOWN_MS) return;
  _lastCheck = now;

  try {
    const { data } = await client.post('/location/nearby', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    for (const reminder of data.triggered || []) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Rappel à proximité !',
          body: reminder.title,
          data: { reminderId: reminder.id },
        },
        trigger: null, // immediate
      });
    }
  } catch {
    // Silent — location checks should never crash the app
  }
}

export const locationTracker = {
  async start() {
    if (_subscription) return; // already running

    const granted = await requestPermissions();
    if (!granted) return;

    _subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,    // check every 15s
        distanceInterval: 80,   // or every 80m moved
      },
      (loc) => handlePosition(loc.coords)
    );
  },

  stop() {
    _subscription?.remove();
    _subscription = null;
  },

  isRunning() {
    return _subscription != null;
  },

  async checkOnce() {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await handlePosition(loc.coords);
  },
};
