
import type { WeatherData } from '@/types/weather';

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility',
    hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,soil_temperature_0cm,soil_moisture_0_1cm,pressure_msl',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.statusText);
      // Log the response body if possible for more details
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      return null;
    }
    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}
