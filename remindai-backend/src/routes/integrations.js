const express = require("express");
const authMiddleware = require("../middleware/auth");
const prisma = require("../services/prisma");

const router = express.Router();
router.use(authMiddleware);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(req) {
  return req.user.userId; // JWT payload uses `userId`
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/integrations/google/callback";

function getOAuth2Client() {
  try {
    const { google } = require("googleapis");
    return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  } catch { return null; }
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI  = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:4000/api/integrations/spotify/callback";

const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

async function refreshSpotifyToken(integration) {
  if (!SPOTIFY_CLIENT_SECRET) return null;
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: integration.refreshToken }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.access_token;
}

// ─── Notion ───────────────────────────────────────────────────────────────────

const NOTION_CLIENT_ID     = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI  = process.env.NOTION_REDIRECT_URI || "http://localhost:4000/api/integrations/notion/callback";

// ─── GET /api/integrations/status ─────────────────────────────────────────────

router.get("/status", async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: uid(req) },
      select: { service: true, expiresAt: true, settings: true, createdAt: true },
    });

    const status = {};
    for (const i of integrations) {
      const expired = i.expiresAt && new Date(i.expiresAt) < new Date();
      status[i.service] = {
        connected: !expired,
        email: i.settings?.email || i.settings?.displayName || null,
        connectedAt: i.createdAt,
      };
    }

    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR
// ══════════════════════════════════════════════════════════════════════════════

router.get("/google/auth", async (req, res) => {
  const client = getOAuth2Client();
  if (!client || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: "Google OAuth not configured" });
  }
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"],
    prompt: "consent",
    state: uid(req),
  });
  res.json({ url });
});

router.get("/google/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;
  if (error) return res.redirect(`remindai://integrations?connected=false&error=${encodeURIComponent(error)}`);
  if (!code)  return res.redirect("remindai://integrations?connected=false&error=no_code");

  const client = getOAuth2Client();
  if (!client) return res.redirect("remindai://integrations?connected=false&error=not_configured");

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    let email = null;
    try {
      const { google } = require("googleapis");
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const { data } = await oauth2.userinfo.get();
      email = data.email;
    } catch {}

    await prisma.integration.upsert({
      where:  { userId_service: { userId: userId || uid(req), service: "google" } },
      create: { userId: userId || uid(req), service: "google", accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null, expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null, settings: { email } },
      update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || undefined, expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null, settings: { email } },
    });

    res.redirect("remindai://integrations?connected=true&service=google");
  } catch (err) {
    res.redirect(`remindai://integrations?connected=false&error=${encodeURIComponent(err.message)}`);
  }
});

router.post("/google/sync", async (req, res) => {
  const { title, scheduledAt, description } = req.body;
  if (!title || !scheduledAt) return res.status(400).json({ error: "title and scheduledAt required" });

  const integration = await prisma.integration.findUnique({
    where: { userId_service: { userId: uid(req), service: "google" } },
  });
  if (!integration) return res.status(400).json({ error: "Google Calendar not connected" });

  const client = getOAuth2Client();
  if (!client) {
    return res.json({ eventId: `mock-${Date.now()}`, link: "#", mock: true });
  }

  try {
    client.setCredentials({ access_token: integration.accessToken, refresh_token: integration.refreshToken });
    client.on("tokens", async (t) => {
      if (t.access_token) {
        await prisma.integration.update({
          where: { userId_service: { userId: uid(req), service: "google" } },
          data:  { accessToken: t.access_token, expiresAt: t.expiry_date ? new Date(t.expiry_date) : null },
        });
      }
    });

    const { google } = require("googleapis");
    const calendar = google.calendar({ version: "v3", auth: client });
    const start = new Date(scheduledAt);
    const end   = new Date(start.getTime() + 30 * 60 * 1000);

    const event = await calendar.events.insert({
      calendarId: "primary",
      resource:   { summary: title, description: description || "", start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } },
    });

    res.json({ eventId: event.data.id, link: event.data.htmlLink });
  } catch (err) {
    if (err.code === 401) {
      await prisma.integration.update({ where: { userId_service: { userId: uid(req), service: "google" } }, data: { expiresAt: new Date(0) } });
      return res.status(401).json({ error: "Token expiré. Reconnecte Google Calendar." });
    }
    res.status(500).json({ error: "Impossible de créer l'événement", detail: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// SPOTIFY
// ══════════════════════════════════════════════════════════════════════════════

router.get("/spotify/auth", async (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(501).json({ error: "Spotify OAuth non configuré — ajoutez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans .env" });
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     SPOTIFY_CLIENT_ID,
    scope:         SPOTIFY_SCOPES,
    redirect_uri:  SPOTIFY_REDIRECT_URI,
    state:         uid(req),
  });
  res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
});

router.get("/spotify/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;
  if (error) return res.redirect(`remindai://integrations?connected=false&service=spotify&error=${encodeURIComponent(error)}`);
  if (!code)  return res.redirect("remindai://integrations?connected=false&service=spotify&error=no_code");

  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: SPOTIFY_REDIRECT_URI }),
    });
    if (!resp.ok) throw new Error(`Spotify token error: ${resp.status}`);
    const tokens = await resp.json();

    // Fetch display name
    let displayName = null;
    try {
      const me = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const meData = await me.json();
      displayName = meData.display_name || meData.email || null;
    } catch {}

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await prisma.integration.upsert({
      where:  { userId_service: { userId: userId, service: "spotify" } },
      create: { userId, service: "spotify", accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null, expiresAt, settings: { displayName } },
      update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || undefined, expiresAt, settings: { displayName } },
    });

    res.redirect("remindai://integrations?connected=true&service=spotify");
  } catch (err) {
    res.redirect(`remindai://integrations?connected=false&service=spotify&error=${encodeURIComponent(err.message)}`);
  }
});

// POST /api/integrations/spotify/trigger-playlist
router.post("/spotify/trigger-playlist", async (req, res) => {
  const { category, playlistQuery } = req.body;

  const DEFAULT_PLAYLISTS = {
    health:   "gym workout motivation",
    habit:    "morning routine energy",
    work:     "deep focus concentration",
    personal: "chill good vibes",
    errand:   "upbeat playlist",
    call:     "calm background music",
  };

  const query = playlistQuery || DEFAULT_PLAYLISTS[category] || "good vibes";
  const spotifyUri = `spotify:search:${encodeURIComponent(query)}`;

  // If we have a connected Spotify account, use Web API to search and return a playlist URI
  const integration = await prisma.integration.findUnique({
    where: { userId_service: { userId: uid(req), service: "spotify" } },
  });

  if (!integration) {
    return res.json({ spotifyUri, type: "search", query });
  }

  try {
    let accessToken = integration.accessToken;

    // Try to refresh if expired
    if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
      accessToken = await refreshSpotifyToken(integration) || accessToken;
      if (accessToken) {
        await prisma.integration.update({
          where: { userId_service: { userId: uid(req), service: "spotify" } },
          data:  { accessToken, expiresAt: new Date(Date.now() + 3600 * 1000) },
        });
      }
    }

    const searchResp = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (searchResp.ok) {
      const searchData = await searchResp.json();
      const playlist = searchData.playlists?.items?.[0];
      if (playlist) {
        return res.json({ spotifyUri: playlist.uri, playlistName: playlist.name, playlistUrl: playlist.external_urls?.spotify, type: "playlist" });
      }
    }
  } catch (err) {
    console.error("[spotify trigger]", err.message);
  }

  res.json({ spotifyUri, type: "search", query });
});

// POST /api/integrations/spotify/playlists — save user's category→playlist mapping
router.post("/spotify/playlists", async (req, res) => {
  const { mappings } = req.body; // { health: 'playlist_id', work: 'playlist_id', ... }
  if (!mappings) return res.status(400).json({ error: "mappings required" });

  try {
    const integration = await prisma.integration.findUnique({
      where: { userId_service: { userId: uid(req), service: "spotify" } },
    });
    if (!integration) return res.status(400).json({ error: "Spotify not connected" });

    await prisma.integration.update({
      where: { userId_service: { userId: uid(req), service: "spotify" } },
      data:  { settings: { ...(integration.settings || {}), playlists: mappings } },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save playlist mappings" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTION
// ══════════════════════════════════════════════════════════════════════════════

router.get("/notion/auth", async (req, res) => {
  if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
    return res.status(501).json({ error: "Notion OAuth non configuré — ajoutez NOTION_CLIENT_ID et NOTION_CLIENT_SECRET dans .env" });
  }
  const params = new URLSearchParams({
    client_id:     NOTION_CLIENT_ID,
    response_type: "code",
    owner:         "user",
    redirect_uri:  NOTION_REDIRECT_URI,
    state:         uid(req),
  });
  res.json({ url: `https://api.notion.com/v1/oauth/authorize?${params}` });
});

router.get("/notion/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;
  if (error) return res.redirect(`remindai://integrations?connected=false&service=notion&error=${encodeURIComponent(error)}`);
  if (!code)  return res.redirect("remindai://integrations?connected=false&service=notion&error=no_code");

  try {
    const creds = Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64");
    const resp = await fetch("https://api.notion.com/v1/oauth/token", {
      method:  "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: NOTION_REDIRECT_URI }),
    });
    if (!resp.ok) throw new Error(`Notion token error: ${resp.status}`);
    const tokenData = await resp.json();

    const displayName = tokenData.owner?.user?.name || tokenData.workspace_name || null;

    await prisma.integration.upsert({
      where:  { userId_service: { userId: userId, service: "notion" } },
      create: { userId, service: "notion", accessToken: tokenData.access_token, settings: { displayName, workspaceId: tokenData.workspace_id } },
      update: { accessToken: tokenData.access_token, settings: { displayName, workspaceId: tokenData.workspace_id } },
    });

    res.redirect("remindai://integrations?connected=true&service=notion");
  } catch (err) {
    res.redirect(`remindai://integrations?connected=false&service=notion&error=${encodeURIComponent(err.message)}`);
  }
});

// POST /api/integrations/notion/sync — export completed reminders to Notion
router.post("/notion/sync", async (req, res) => {
  const integration = await prisma.integration.findUnique({
    where: { userId_service: { userId: uid(req), service: "notion" } },
  });
  if (!integration) return res.status(400).json({ error: "Notion not connected" });

  try {
    // Get recently completed reminders (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const reminders = await prisma.reminder.findMany({
      where: { userId: uid(req), deletedAt: null, completedAt: { gte: since, not: null } },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    const token    = integration.accessToken;
    const settings = integration.settings || {};

    // Find or create RemindAI database in Notion
    let databaseId = settings.databaseId;

    if (!databaseId) {
      // Search for existing RemindAI database
      const searchResp = await fetch("https://api.notion.com/v1/search", {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body:    JSON.stringify({ query: "RemindAI", filter: { value: "database", property: "object" } }),
      });
      const searchData = await searchResp.json();
      const existing = searchData.results?.find(r => r.title?.[0]?.plain_text === "RemindAI");
      databaseId = existing?.id;

      // Create database if not found — requires a parent page ID from workspace
      if (!databaseId && settings.workspaceId) {
        // We can't create without a parent page, so we'll return an informative message
        return res.json({ synced: 0, message: "Crée d'abord une page 'RemindAI' dans Notion et reconnecte." });
      }
    }

    if (!databaseId) {
      return res.json({ synced: 0, message: "Base de données Notion introuvable. Reconnecte Notion." });
    }

    let synced = 0;
    for (const r of reminders) {
      try {
        await fetch("https://api.notion.com/v1/pages", {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: {
              Name:      { title: [{ text: { content: r.title } }] },
              Catégorie: { select: { name: r.category } },
              Complété:  { date:   { start: r.completedAt.toISOString() } },
              Priorité:  { number: r.priority },
            },
          }),
        });
        synced++;
      } catch {}
    }

    await prisma.integration.update({
      where: { userId_service: { userId: uid(req), service: "notion" } },
      data:  { settings: { ...settings, databaseId, lastSync: new Date().toISOString(), syncCount: (settings.syncCount || 0) + synced } },
    });

    res.json({ synced, total: reminders.length });
  } catch (err) {
    console.error("[notion sync]", err.message);
    res.status(500).json({ error: "Sync Notion échoué", detail: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCONNECT
// ══════════════════════════════════════════════════════════════════════════════

router.delete("/:service", async (req, res) => {
  const { service } = req.params;
  try {
    await prisma.integration.delete({
      where: { userId_service: { userId: uid(req), service } },
    });
    res.json({ success: true });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Integration not found" });
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

module.exports = router;
