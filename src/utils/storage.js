import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'remindai_access_token',
  REFRESH_TOKEN: 'remindai_refresh_token',
  USER: 'remindai_user',
  ONBOARDING_SEEN: 'remindai_onboarding_seen',
  REM_SETUP_SEEN: 'remindai_rem_setup_seen',
  DAILY_SUMMARY_DATE: 'remindai_daily_summary_date',
  DAILY_SUMMARY_NOTIF_ID: 'remindai_daily_summary_notif_id',
};

export const storage = {
  async setTokens(access, refresh) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async setUser(user) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  async setOnboardingSeen() {
    await SecureStore.setItemAsync(KEYS.ONBOARDING_SEEN, 'true');
  },

  async getOnboardingSeen() {
    const val = await SecureStore.getItemAsync(KEYS.ONBOARDING_SEEN);
    return val === 'true';
  },

  async setRemSetupSeen() {
    await SecureStore.setItemAsync(KEYS.REM_SETUP_SEEN, 'true');
  },

  async getRemSetupSeen() {
    const val = await SecureStore.getItemAsync(KEYS.REM_SETUP_SEEN);
    return val === 'true';
  },

  async getDailySummaryDate() {
    return SecureStore.getItemAsync(KEYS.DAILY_SUMMARY_DATE);
  },

  async setDailySummaryDate(dateStr) {
    await SecureStore.setItemAsync(KEYS.DAILY_SUMMARY_DATE, dateStr);
  },

  async getDailySummaryNotifId() {
    return SecureStore.getItemAsync(KEYS.DAILY_SUMMARY_NOTIF_ID);
  },

  async setDailySummaryNotifId(id) {
    await SecureStore.setItemAsync(KEYS.DAILY_SUMMARY_NOTIF_ID, id);
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
    await SecureStore.deleteItemAsync(KEYS.DAILY_SUMMARY_DATE);
    await SecureStore.deleteItemAsync(KEYS.DAILY_SUMMARY_NOTIF_ID);
  },
};
