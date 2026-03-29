import type { WeatherData } from '@/types';

export const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
};

export const weatherEmojis: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '🌧️', 85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function isSevere(code: number): boolean {
  return [65, 67, 73, 75, 77, 82, 86, 95, 96, 99].includes(code);
}

export function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  const current = data.current;
  const hourly = data.hourly;

  // Find index matching current hour
  const nowPrefix = new Date().toISOString().slice(0, 13); // "2024-01-15T14"
  const startIdx = (hourly.time as string[]).findIndex((t) => t.slice(0, 13) === nowPrefix);
  const baseIdx = startIdx >= 0 ? startIdx : 0;

  const forecast = [];
  for (let i = 0; i < 6; i++) {
    const idx = baseIdx + i;
    if (idx < (hourly.time as string[]).length) {
      forecast.push({
        time: hourly.time[idx],
        temperature: Math.round(hourly.temperature_2m[idx]),
        weatherCode: hourly.weather_code[idx],
        precipitationProbability: hourly.precipitation_probability?.[idx] ?? 0,
      });
    }
  }

  const weatherCode = current.weather_code as number;
  return {
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: current.wind_direction_10m,
    weatherCode,
    weatherDescription: weatherDescriptions[weatherCode] ?? 'Unknown',
    precipitation: current.precipitation,
    alerts: [],
    hourlyForecast: forecast,
  };
}
