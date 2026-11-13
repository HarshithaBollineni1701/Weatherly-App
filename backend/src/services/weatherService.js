const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export async function resolveLocation(query) {
  const raw = String(query || '').trim();
  if (!raw) throw new Error('Enter a city or location to search.');
  const normalized = raw.replace(/\bbangalore\b/gi, 'Bengaluru');
  const response = await fetch(`${GEOCODING_URL}?${new URLSearchParams({ name: normalized, count: '1', language: 'en', format: 'json' })}`);
  if (!response.ok) throw new Error('Location search service is unavailable. Try again shortly.');
  const data = await response.json();
  if (!data.results?.length) throw new Error(`We couldn't find “${raw}”. Try a city name such as Bengaluru.`);
  return data.results[0];
}

export async function getWeather(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
    timezone: 'auto', forecast_days: '5'
  });
  const response = await fetch(`${FORECAST_URL}?${params}`);
  if (!response.ok) throw new Error('Weather service is unavailable. Please try again.');
  const data = await response.json();
  return {
    location: { name: location.name || 'Selected location', admin1: location.admin1 || '', country: location.country || '', latitude: Number(location.latitude), longitude: Number(location.longitude), timezone: data.timezone },
    current: {
      temperature: data.current.temperature_2m, humidity: data.current.relative_humidity_2m,
      apparentTemperature: data.current.apparent_temperature, weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m, precipitation: data.current.precipitation, isDay: data.current.is_day
    },
    daily: data.daily.time.map((date, index) => ({ date, weatherCode: data.daily.weather_code[index], max: data.daily.temperature_2m_max[index], min: data.daily.temperature_2m_min[index], sunrise: data.daily.sunrise[index], sunset: data.daily.sunset[index], precipitationProbability: data.daily.precipitation_probability_max[index] }))
  };
}
