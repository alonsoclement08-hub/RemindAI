import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { storage } from '../utils/storage';

WebBrowser.maybeCompleteAuthSession();

// Web client ID used for Expo Go development (no bundle ID restriction)
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const STORAGE_KEY = 'google_tokens';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
];

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function getGoogleAuthRequest() {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.log('[Google Auth] redirectUri:', redirectUri);
  return {
    redirectUri,
    request: {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery: DISCOVERY,
  };
}

export async function exchangeGoogleCode(code, codeVerifier) {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Google token exchange failed: ' + err);
  }

  const tokens = await res.json();
  await storage.set(STORAGE_KEY, JSON.stringify({
    ...tokens,
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
  }));
  return tokens;
}

async function getAccessToken() {
  const raw = await storage.get(STORAGE_KEY);
  if (!raw) throw new Error('Not connected to Google');
  const tokens = JSON.parse(raw);

  if (Date.now() > tokens.expires_at - 60000 && tokens.refresh_token) {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) { await storage.remove(STORAGE_KEY); throw new Error('Session Google expirée'); }
    const refreshed = await res.json();
    const updated = { ...tokens, ...refreshed, expires_at: Date.now() + (refreshed.expires_in || 3600) * 1000 };
    await storage.set(STORAGE_KEY, JSON.stringify(updated));
    return updated.access_token;
  }
  return tokens.access_token;
}

async function gapi(path, params = {}) {
  const token = await getAccessToken();
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`https://www.googleapis.com${path}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${path}`);
  return res.json();
}

export async function isGoogleConnected() {
  try {
    const raw = await storage.get(STORAGE_KEY);
    return !!raw;
  } catch { return false; }
}

export async function disconnectGoogle() {
  await storage.remove(STORAGE_KEY);
}

export async function getGoogleProfile() {
  return gapi('/oauth2/v3/userinfo');
}

export async function getWorkContext(reminderTitle) {
  const keywords = reminderTitle.replace(/\b(réunion|meeting|avec|call|appel|rdv|rendez-vous|projet|rapport)\b/gi, '').trim();
  const now = new Date().toISOString();
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [events, files, contacts] = await Promise.allSettled([
    // Google Calendar events
    gapi('/calendar/v3/calendars/primary/events', {
      timeMin: now,
      timeMax: in7days,
      q: keywords.substring(0, 40),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 3,
      fields: 'items(id,summary,start,end,attendees,hangoutLink,description)',
    }),
    // Google Drive files
    gapi('/drive/v3/files', {
      q: `fullText contains '${keywords.replace(/'/g, '').substring(0, 30)}' and trashed=false`,
      fields: 'files(id,name,webViewLink,modifiedTime,mimeType)',
      pageSize: 5,
      orderBy: 'modifiedTime desc',
    }),
    // Google Contacts
    gapi('/v1/people/me/connections', {
      personFields: 'names,emailAddresses,organizations,phoneNumbers',
      pageSize: 3,
    }),
  ]);

  return {
    events: events.status === 'fulfilled' ? (events.value.items || []) : [],
    files: files.status === 'fulfilled' ? (files.value.files || []) : [],
    contacts: contacts.status === 'fulfilled' ? (contacts.value.connections || []) : [],
    provider: 'google',
  };
}
