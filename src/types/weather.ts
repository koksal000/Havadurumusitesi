
export interface CurrentWeatherAPI {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day?: number; // Can be 0 or 1
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  time: string;
  interval: number;
  visibility?: number; 
  uv_index?: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: (number | null)[]; // Can be null
  precipitation: number[];
  rain: number[];
  showers: number[];
  snowfall: number[];
  weather_code: number[];
  surface_pressure: number[];
  cloud_cover: number[];
  visibility: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  wind_gusts_10m: number[];
  uv_index: (number | null)[]; // Can be null
  soil_temperature_0cm: number[];
  soil_moisture_0_1cm: number[];
  pressure_msl: number[];
  is_day: (number | undefined)[]; // Added is_day, can be 0 or 1 or undefined
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max?: (number | null)[]; // Can be null
  uv_index_clear_sky_max?: (number | null)[]; // Can be null
  precipitation_sum: number[];
  rain_sum: number[];
  showers_sum: number[];
  snowfall_sum: number[];
  precipitation_hours: number[];
  precipitation_probability_max?: (number | null)[]; // Can be null
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  wind_direction_10m_dominant: number[];
  shortwave_radiation_sum: number[];
  et0_fao_evapotranspiration: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: CurrentWeatherAPI;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export interface FavoriteLocation {
  province: string;
  district: string;
  lat: number;
  lon: number;
}

