import type { WeatherData } from '@/types/weather';

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,is_day,visibility,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weathercode,windspeed_10m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility',
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.statusText);
      return null;
    }
    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}
