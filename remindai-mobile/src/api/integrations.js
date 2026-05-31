import client from './client';

export const integrationsAPI = {
  getStatus: () =>
    client.get('/integrations/status').then(r => r.data.status),

  // Google Calendar
  getGoogleAuthUrl: () =>
    client.get('/integrations/google/auth').then(r => r.data.url),

  syncToGoogle: (data) =>
    client.post('/integrations/google/sync', data).then(r => r.data),

  // Spotify
  getSpotifyAuthUrl: () =>
    client.get('/integrations/spotify/auth').then(r => r.data.url),

  triggerSpotifyPlaylist: (category, playlistQuery) =>
    client.post('/integrations/spotify/trigger-playlist', { category, playlistQuery }).then(r => r.data),

  saveSpotifyPlaylists: (mappings) =>
    client.post('/integrations/spotify/playlists', { mappings }).then(r => r.data),

  // Notion
  getNotionAuthUrl: () =>
    client.get('/integrations/notion/auth').then(r => r.data.url),

  syncToNotion: () =>
    client.post('/integrations/notion/sync').then(r => r.data),

  // Common
  disconnect: (service) =>
    client.delete(`/integrations/${service}`).then(r => r.data),
};
