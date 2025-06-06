
export interface CurrentWeatherAPI {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature?: number | null;
  is_day?: number; // 1 for day, 0 for night
  precipitation: number; 
  rain?: number | null;
  showers?: number | null;
  snowfall?: number | null; // MET.no precipitation is liquid equivalent for snow
  weather_code: number;
  cloud_cover?: number | null;
  surface_pressure?: number | null; 
  wind_speed_10m: number; // km/h (converted from m/s if from MET.no)
  wind_direction_10m: number;
  wind_gusts_10m?: number | null; // km/h (converted from m/s if from MET.no)
  time: string; 
  interval?: number;
  visibility?: number | null; // In meters
  uv_index?: number | null;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  apparent_temperature?: (number | null)[] | null;
  precipitation_probability?: (number | null)[] | null;
  precipitation: (number | null)[];
  rain?: (number | null)[] | null;
  showers?: (number | null)[] | null;
  snowfall?: (number | null)[] | null; // MET.no precipitation is liquid equivalent for snow
  weather_code: (number | null)[];
  surface_pressure?: (number | null)[] | null; 
  cloud_cover?: (number | null)[] | null;
  visibility?: (number | null)[] | null; // In meters
  wind_speed_10m: (number | null)[]; // km/h
  wind_direction_10m: (number | null)[];
  wind_gusts_10m?: (number | null)[] | null; // km/h
  uv_index?: (number | null)[] | null;
  soil_temperature_0cm?: (number | null)[] | null; 
  soil_moisture_0_1cm?: (number | null)[] | null; 
  pressure_msl?: (number | null)[] | null; // For MET.no, this is same as surface_pressure (air_pressure_at_sea_level)
  is_day?: (number | undefined | null)[]; 
}

export interface DailyWeather {
  time: string[]; 
  weather_code: (number | null)[]; 
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  apparent_temperature_max?: (number | null)[] | null;
  apparent_temperature_min?: (number | null)[] | null;
  sunrise?: (string | null)[] | null; // ISO string from Open-Meteo
  sunset?: (string | null)[] | null;  // ISO string from Open-Meteo
  uv_index_max?: (number | null)[] | null; 
  uv_index_clear_sky_max?: (number | null)[] | null; 
  precipitation_sum: (number | null)[];
  rain_sum?: (number | null)[] | null;
  showers_sum?: (number | null)[] | null;
  snowfall_sum?: (number | null)[] | null; // MET.no precipitation is liquid equivalent for snow
  precipitation_hours?: (number | null)[] | null;
  precipitation_probability_max?: (number | null)[] | null; 
  wind_speed_10m_max: (number | null)[]; // km/h
  wind_gusts_10m_max?: (number | null)[] | null; // km/h
  wind_direction_10m_dominant?: (number | null)[] | null;
  shortwave_radiation_sum?: (number | null)[] | null; 
  et0_fao_evapotranspiration?: (number | null)[] | null; 
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
  api_source?: string; // e.g., "MET Norway", "Open-Meteo", "MET Norway / Open-Meteo"
}

export interface FavoriteLocation {
  province: string;
  district: string;
  lat: number;
  lon: number;
}

    