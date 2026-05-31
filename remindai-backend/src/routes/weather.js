const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// WMO weather codes → UI info
function getWeatherInfo(code) {
  if (code === 0)            return { condition: 'sunny',        emoji: '☀️',  label: 'Ensoleillé' };
  if (code <= 2)             return { condition: 'partly_cloudy', emoji: '⛅',  label: 'Partiellement nuageux' };
  if (code === 3)            return { condition: 'cloudy',        emoji: '☁️',  label: 'Nuageux' };
  if (code <= 48)            return { condition: 'foggy',         emoji: '🌫️', label: 'Brumeux' };
  if (code <= 57)            return { condition: 'drizzle',       emoji: '🌦️', label: 'Bruine' };
  if (code <= 67)            return { condition: 'rainy',         emoji: '🌧️', label: 'Pluvieux' };
  if (code <= 77)            return { condition: 'snowy',         emoji: '❄️',  label: 'Neigeux' };
  if (code <= 82)            return { condition: 'showers',       emoji: '🌦️', label: 'Averses' };
  if (code <= 86)            return { condition: 'snow_showers',  emoji: '🌨️', label: 'Averses neige' };
  return                            { condition: 'stormy',        emoji: '⛈️',  label: 'Orageux' };
}

function buildAdvice(condition, temp) {
  const h = new Date().getHours();
  const time = h < 12 ? 'ce matin' : h < 18 ? 'cet après-midi' : 'ce soir';

  if (condition === 'sunny' && temp >= 18) return `${temp}°C et ensoleillé — parfait pour une activité en plein air ${time} !`;
  if (condition === 'sunny' && temp >= 10) return `Beau temps (${temp}°C) — idéal pour sortir ${time}.`;
  if (condition === 'partly_cloudy' && temp >= 15) return `Partiellement nuageux, ${temp}°C — bonne météo pour travailler dehors.`;
  if (condition === 'rainy' || condition === 'showers') return `Il pleut (${temp}°C) — parfait pour rester concentré à l'intérieur.`;
  if (condition === 'drizzle') return `Bruine (${temp}°C) — prends un parapluie si tu sors.`;
  if (condition === 'snowy' || condition === 'snow_showers') return `Il neige (${temp}°C) — reste au chaud et avance tes projets.`;
  if (condition === 'stormy') return `Orageux (${temp}°C) — évite de sortir, c'est le moment de te concentrer.`;
  if (condition === 'foggy') return `Brumeux (${temp}°C) — visibilité réduite, fais attention en conduisant.`;
  if (temp > 28) return `${temp}°C — il fait très chaud, pense à bien t'hydrater !`;
  if (temp < 3)  return `${temp}°C — il fait très froid, couvre-toi bien !`;
  return null;
}

// GET /api/weather/current?lat=...&lng=...
router.get('/current', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&timezone=auto&wind_speed_unit=kmh`;

    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const data = await response.json();

    const temp       = Math.round(data.current.temperature_2m);
    const feelsLike  = Math.round(data.current.apparent_temperature);
    const wind       = Math.round(data.current.wind_speed_10m);
    const code       = data.current.weather_code;

    const { condition, emoji, label } = getWeatherInfo(code);
    const advice = buildAdvice(condition, temp);

    res.json({ temp, feelsLike, wind, condition, emoji, label, advice });
  } catch (err) {
    console.error('[weather]', err.message);
    res.status(503).json({ error: 'Météo indisponible', detail: err.message });
  }
});

module.exports = router;
