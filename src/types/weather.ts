
export interface CurrentWeatherAPI {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature?: number | null;
  is_day?: number; // 1 for day, 0 for night
  precipitation: number; // Total precipitation for the relevant period (e.g., next hour)
  rain?: number | null;
  showers?: number | null;
  snowfall?: number | null;
  weather_code: number;
  cloud_cover?: number | null;
  surface_pressure?: number | null; // Or air_pressure_at_sea_level from MET.no
  wind_speed_10m: number; // Expecting km/h after conversion from m/s
  wind_direction_10m: number;
  wind_gusts_10m?: number | null; // Expecting km/h after conversion from m/s
  time: string; // Timestamp of the current data point
  interval?: number;
  visibility?: number | null;
  uv_index?: number | null;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  apparent_temperature?: (number | null)[] | null;
  precipitation_probability?: (number | null)[] | null; // MET.no might not provide this directly
  precipitation: (number | null)[];
  rain?: (number | null)[] | null;
  showers?: (number | null)[] | null;
  snowfall?: (number | null)[] | null;
  weather_code: (number | null)[];
  surface_pressure?: (number | null)[] | null; // Or pressure_msl
  cloud_cover?: (number | null)[] | null;
  visibility?: (number | null)[] | null;
  wind_speed_10m: (number | null)[]; // Expecting km/h
  wind_direction_10m: (number | null)[];
  wind_gusts_10m?: (number | null)[] | null; // Expecting km/h
  uv_index?: (number | null)[] | null;
  soil_temperature_0cm?: (number | null)[] | null; // Likely unavailable from MET.no compact
  soil_moisture_0_1cm?: (number | null)[] | null; // Likely unavailable
  pressure_msl?: (number | null)[] | null; // From air_pressure_at_sea_level
  is_day?: (number | undefined | null)[]; // 1 for day, 0 for night
}

export interface DailyWeather {
  time: string[]; // Date string YYYY-MM-DD
  weather_code: (number | null)[]; // Representative weather code for the day
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  apparent_temperature_max?: (number | null)[] | null;
  apparent_temperature_min?: (number | null)[] | null;
  sunrise?: (string | null)[] | null; // Likely unavailable from MET.no
  sunset?: (string | null)[] | null; // Likely unavailable
  uv_index_max?: (number | null)[] | null; // Likely unavailable
  uv_index_clear_sky_max?: (number | null)[] | null; // Likely unavailable
  precipitation_sum: (number | null)[];
  rain_sum?: (number | null)[] | null;
  showers_sum?: (number | null)[] | null;
  snowfall_sum?: (number | null)[] | null;
  precipitation_hours?: (number | null)[] | null;
  precipitation_probability_max?: (number | null)[] | null; // Likely unavailable
  wind_speed_10m_max: (number | null)[]; // Expecting km/h
  wind_gusts_10m_max?: (number | null)[] | null; // Expecting km/h
  wind_direction_10m_dominant?: (number | null)[] | null;
  shortwave_radiation_sum?: (number | null)[] | null; // Likely unavailable
  et0_fao_evapotranspiration?: (number | null)[] | null; // Likely unavailable
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  elevation?: number;
  current: CurrentWeatherAPI;
  hourly: HourlyWeather;
  daily: DailyWeather;
  api_source?: string; // To indicate data source, e.g., "MET Norway"
}

export interface FavoriteLocation {
  province: string;
  district: string;
  lat: number;
  lon: number;
}
