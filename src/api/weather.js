import client from './client';

export const weatherAPI = {
  getCurrent: (lat, lng) =>
    client.get(`/weather/current?lat=${lat}&lng=${lng}`).then(r => r.data),
};
