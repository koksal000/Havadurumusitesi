export interface CurrentWeatherAPI { // Renamed to avoid conflict with CurrentWeather component type
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  is_day?: number; // available in current_weather, not in current object typically
  time: string;
  interval: number;
  visibility?: number; // in km
  uv_index?: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weathercode: number[];
  windspeed_10m: number[];
  relative_humidity_2m: number[]; // Added for humidity graph
  apparent_temperature: number[]; // Added for felt temperature
  surface_pressure: number[]; // Added for pressure
  uv_index: number[]; // Added for UV index
  visibility: number[]; // Added for visibility
}

export interface DailyWeather {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_probability_max?: number[];
  uv_index_max?: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: CurrentWeatherAPI; // Using 'current' for more detailed current values
  hourly: HourlyWeather;
  daily: DailyWeather;
}

// Simplified type for favorite item stored in localStorage
export interface FavoriteLocation {
  province: string;
  district: string;
  lat: number;
  lon: number;
}
