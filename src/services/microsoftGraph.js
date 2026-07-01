import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { storage } from '../utils/storage';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID || '';
// 'common' = tout le monde peut se connecter (comptes perso + entreprise)
const TENANT = 'common';

const SCOPES = [
  'openid', 'profile', 'email',
  'User.Read',
  'Calendars.Read',
  'Files.Read.All',
  'People.Read',
  'Mail.Read',
];

const STORAGE_KEY = 'ms_tokens';

export function getMsAuthRequest() {
  // makeRedirectUri gère automatiquement :
  // - Expo Go (dev) → exp://xxx.xxx.xxx.xxx:8081
  // - Build standalone → remindai://
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'remindai',
    path: 'auth/microsoft',
  });

  return {
    redirectUri,
    request: {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { prompt: 'select_account' },
    },
    discovery: {
      authorizationEndpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    },
  };
}

export function getMsRedirectUris() {
  return [
    'remindai://auth/microsoft',
    'https://auth.expo.io/@ton-compte-expo/remindai',
    'msauth.com.remindai.app://auth',
  ];
}

export async function exchangeCodeForToken(code, codeVerifier, redirectUri) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: SCOPES.join(' '),
  });

  const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error('Token exchange failed');
  const tokens = await res.json();
  await storage.set(STORAGE_KEY, JSON.stringify({
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  }));
  return tokens;
}

async function getAccessToken() {
  const raw = await storage.get(STORAGE_KEY);
  if (!raw) throw new Error('Not connected to Microsoft');
  const tokens = JSON.parse(raw);

  // Refresh if expired
  if (Date.now() > tokens.expires_at - 60000 && tokens.refresh_token) {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      scope: SCOPES.join(' '),
    });
    const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) { await storage.remove(STORAGE_KEY); throw new Error('Session expirée'); }
    const refreshed = await res.json();
    const updated = { ...tokens, ...refreshed, expires_at: Date.now() + refreshed.expires_in * 1000 };
    await storage.set(STORAGE_KEY, JSON.stringify(updated));
    return updated.access_token;
  }
  return tokens.access_token;
}

async function graph(path, params = {}) {
  const token = await getAccessToken();
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}${qs}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Graph ${res.status}: ${path}`);
  return res.json();
}

export async function getMsProfile() {
  return graph('/me');
}

export async function isMsConnected() {
  try {
    const raw = await storage.get(STORAGE_KEY);
    return !!raw;
  } catch { return false; }
}

export async function disconnectMs() {
  await storage.remove(STORAGE_KEY);
}

// ── Search meeting info for a reminder ───────────────────────────────────────

export async function getMeetingContext(reminderTitle) {
  const keywords = reminderTitle.replace(/\b(réunion|meeting|avec|call|appel|rdv|rendez-vous)\b/gi, '').trim();

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [events, people, files] = await Promise.allSettled([
    // Upcoming calendar events matching the keywords
    graph('/me/calendarView', {
      startDateTime: now.toISOString(),
      endDateTime: in7days.toISOString(),
      $filter: keywords ? `contains(tolower(subject), '${keywords.toLowerCase().substring(0, 30)}')` : undefined,
      $select: 'subject,start,end,attendees,onlineMeeting,bodyPreview,organizer',
      $top: 3,
      $orderby: 'start/dateTime asc',
    }),
    // People you work with most
    graph('/me/people', {
      $search: `"${keywords.substring(0, 30)}"`,
      $select: 'displayName,jobTitle,department,emailAddresses,phones',
      $top: 3,
    }),
    // Files related to the topic
    graph('/me/drive/search(q=\'' + keywords.replace(/'/g, '').substring(0, 40) + '\')', {
      $select: 'name,webUrl,lastModifiedDateTime,file',
      $top: 5,
    }),
  ]);

  const result = {
    events: events.status === 'fulfilled' ? (events.value.value || []) : [],
    people: people.status === 'fulfilled' ? (people.value.value || []) : [],
    files: files.status === 'fulfilled' ? (files.value.value || []).filter(f => f.file) : [],
  };

  return result;
}
