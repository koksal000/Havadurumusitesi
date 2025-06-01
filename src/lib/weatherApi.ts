
import type { WeatherData, CurrentWeatherAPI, HourlyWeather, DailyWeather } from '@/types/weather';
import { parseISO, formatISO, startOfDay, endOfDay, eachHourOfInterval, isSameDay, getHours } from 'date-fns';

const API_BASE_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const USER_AGENT = 'havadurumuxsite/1.0 havadurumuxsite@gmail.com';

const M_S_TO_KM_H = 3.6;

// Simplified mapping from MET.no symbol_code to WMO weather codes
// Refer to: https://api.met.no/weatherapi/weathericon/2.0/documentation
// And WMO codes used by Open-Meteo (or a standard WMO table)
// This mapping is illustrative and might need expansion/refinement
const metSymbolToWMOCode: Record<string, { wmo: number, is_rain?: boolean, is_snow?: boolean, is_showers?: boolean }> = {
  'clearsky_day': { wmo: 0 }, 'clearsky_night': { wmo: 0 },
  'fair_day': { wmo: 1 }, 'fair_night': { wmo: 1 },
  'partlycloudy_day': { wmo: 2 }, 'partlycloudy_night': { wmo: 2 },
  'cloudy': { wmo: 3 },
  'lightrainshowers_day': { wmo: 80, is_showers: true, is_rain: true }, 'lightrainshowers_night': { wmo: 80, is_showers: true, is_rain: true },
  'rainshowers_day': { wmo: 81, is_showers: true, is_rain: true }, 'rainshowers_night': { wmo: 81, is_showers: true, is_rain: true },
  'heavyrainshowers_day': { wmo: 82, is_showers: true, is_rain: true }, 'heavyrainshowers_night': { wmo: 82, is_showers: true, is_rain: true },
  'lightrainshowersandthunder_day': { wmo: 95, is_showers: true, is_rain: true }, 'lightrainshowersandthunder_night': { wmo: 95, is_showers: true, is_rain: true },
  'rainshowersandthunder_day': { wmo: 95, is_showers: true, is_rain: true }, 'rainshowersandthunder_night': { wmo: 95, is_showers: true, is_rain: true },
  'heavyrainshowersandthunder_day': { wmo: 97, is_showers: true, is_rain: true }, 'heavyrainshowersandthunder_night': { wmo: 97, is_showers: true, is_rain: true }, // WMO 97 for heavy TS
  'lightsleetshowers_day': { wmo: 83, is_showers: true }, 'lightsleetshowers_night': { wmo: 83, is_showers: true }, // WMO 83 for light sleet showers
  'sleetshowers_day': { wmo: 83, is_showers: true }, 'sleetshowers_night': { wmo: 83, is_showers: true },
  'heavysleetshowers_day': { wmo: 84, is_showers: true }, 'heavysleetshowers_night': { wmo: 84, is_showers: true }, // WMO 84 for heavy sleet showers
  'lightsnowshowers_day': { wmo: 85, is_showers: true, is_snow: true }, 'lightsnowshowers_night': { wmo: 85, is_showers: true, is_snow: true },
  'snowshowers_day': { wmo: 85, is_showers: true, is_snow: true }, 'snowshowers_night': { wmo: 85, is_showers: true, is_snow: true },
  'heavysnowshowers_day': { wmo: 86, is_showers: true, is_snow: true }, 'heavysnowshowers_night': { wmo: 86, is_showers: true, is_snow: true },
  'lightrain': { wmo: 61, is_rain: true }, 'rain': { wmo: 63, is_rain: true }, 'heavyrain': { wmo: 65, is_rain: true },
  'lightrainandthunder': { wmo: 95, is_rain: true }, 'rainandthunder': { wmo: 95, is_rain: true }, 'heavyrainandthunder': { wmo: 97, is_rain: true },
  'lightsleet': { wmo: 67 }, 'sleet': { wmo: 67 }, 'heavysleet': { wmo: 67 }, // WMO 67 for light/moderate sleet
  'lightsnow': { wmo: 71, is_snow: true }, 'snow': { wmo: 73, is_snow: true }, 'heavysnow': { wmo: 75, is_snow: true },
  'lightsnowandthunder': { wmo: 95, is_snow: true }, 'snowandthunder': { wmo: 95, is_snow: true }, 'heavysnowandthunder': { wmo: 97, is_snow: true },
  'fog': { wmo: 45 },
  // Default for unknown symbols
  'unknown': { wmo: 0 }
};

function getSymbolInfo(symbolCode?: string): { wmo: number; is_day: number; is_rain?: boolean; is_snow?: boolean; is_showers?: boolean } {
  if (!symbolCode) return { wmo: metSymbolToWMOCode['unknown'].wmo, is_day: 1 };
  const mapping = metSymbolToWMOCode[symbolCode.toLowerCase()] || metSymbolToWMOCode['unknown'];
  const is_day = symbolCode.toLowerCase().includes('_day') ? 1 : (symbolCode.toLowerCase().includes('_night') ? 0 : 1); // Default to day if not specified
  return { ...mapping, is_day };
}


export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch weather data from MET.no:', response.statusText);
      const errorBody = await response.text();
      console.error('Error response body from MET.no:', errorBody);
      return null;
    }
    const rawData = await response.json();

    if (!rawData.properties || !rawData.properties.timeseries) {
      console.error('MET.no data is not in expected format:', rawData);
      return null;
    }

    const timeseries = rawData.properties.timeseries;
    if (timeseries.length === 0) {
      console.error('MET.no timeseries is empty');
      return null;
    }

    // --- CURRENT WEATHER ---
    const currentRaw = timeseries[0]; // Assuming the first entry is current enough
    const currentSymbolInfo = getSymbolInfo(currentRaw.data?.next_1_hours?.summary?.symbol_code || currentRaw.data?.next_6_hours?.summary?.symbol_code);

    const current: CurrentWeatherAPI = {
      time: currentRaw.time,
      temperature_2m: currentRaw.data.instant.details.air_temperature,
      relative_humidity_2m: currentRaw.data.instant.details.relative_humidity,
      surface_pressure: currentRaw.data.instant.details.air_pressure_at_sea_level,
      cloud_cover: currentRaw.data.instant.details.cloud_area_fraction,
      wind_speed_10m: (currentRaw.data.instant.details.wind_speed ?? 0) * M_S_TO_KM_H,
      wind_direction_10m: currentRaw.data.instant.details.wind_from_direction,
      wind_gusts_10m: currentRaw.data.instant.details.wind_speed_of_gust ? currentRaw.data.instant.details.wind_speed_of_gust * M_S_TO_KM_H : null,
      precipitation: currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0,
      weather_code: currentSymbolInfo.wmo,
      is_day: currentSymbolInfo.is_day,
      // Fields that might be null or need default
      apparent_temperature: null, // MET.no compact doesn't provide this
      uv_index: null, // MET.no compact doesn't provide this
      visibility: null, // Not directly in compact
      rain: currentSymbolInfo.is_rain ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      showers: currentSymbolInfo.is_showers ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      snowfall: currentSymbolInfo.is_snow ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0, // MET.no precipitation_amount is in mm for snow too
    };

    // --- HOURLY WEATHER ---
    const hourly: HourlyWeather = {
      time: [],
      temperature_2m: [],
      relative_humidity_2m: [],
      precipitation: [],
      weather_code: [],
      cloud_cover: [],
      surface_pressure: [], // Using air_pressure_at_sea_level for this
      wind_speed_10m: [],
      wind_direction_10m: [],
      wind_gusts_10m: [],
      is_day: [],
      // Optional fields initialized
      apparent_temperature: [],
      precipitation_probability: [],
      uv_index: [],
      pressure_msl: [],
      visibility: [],
      rain: [],
      showers: [],
      snowfall: [],
    };

    // Process up to 7 days of hourly data if available
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const entry of timeseries) {
      if (parseISO(entry.time) > sevenDaysFromNow) break; // Limit to 7 days

      const entryTime = entry.time;
      const details = entry.data?.instant?.details;
      const next1HourDetails = entry.data?.next_1_hours?.details;
      const next1HourSummary = entry.data?.next_1_hours?.summary;
      const symbolInfo = getSymbolInfo(next1HourSummary?.symbol_code);

      hourly.time.push(entryTime);
      hourly.temperature_2m.push(details?.air_temperature ?? null);
      hourly.relative_humidity_2m.push(details?.relative_humidity ?? null);
      hourly.precipitation.push(next1HourDetails?.precipitation_amount ?? null);
      hourly.weather_code.push(symbolInfo.wmo);
      hourly.cloud_cover!.push(details?.cloud_area_fraction ?? null);
      hourly.surface_pressure!.push(details?.air_pressure_at_sea_level ?? null);
      hourly.pressure_msl!.push(details?.air_pressure_at_sea_level ?? null);
      hourly.wind_speed_10m.push(details?.wind_speed !== undefined ? details.wind_speed * M_S_TO_KM_H : null);
      hourly.wind_direction_10m.push(details?.wind_from_direction ?? null);
      hourly.wind_gusts_10m!.push(details?.wind_speed_of_gust !== undefined && details.wind_speed_of_gust !== null ? details.wind_speed_of_gust * M_S_TO_KM_H : null);
      hourly.is_day!.push(symbolInfo.is_day);
      
      // Optional fields with nulls
      hourly.apparent_temperature!.push(null);
      hourly.precipitation_probability!.push(null); // MET.no doesn't give prob directly
      hourly.uv_index!.push(null);
      hourly.visibility!.push(null);

      hourly.rain!.push(symbolInfo.is_rain ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.showers!.push(symbolInfo.is_showers ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.snowfall!.push(symbolInfo.is_snow ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
    }
    
    // --- DAILY WEATHER ---
    const daily: DailyWeather = {
      time: [],
      weather_code: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
      precipitation_sum: [],
      wind_speed_10m_max: [],
      // Optional with empty arrays
      apparent_temperature_max: [],
      apparent_temperature_min: [],
      sunrise: [],
      sunset: [],
      uv_index_max: [],
      uv_index_clear_sky_max: [],
      rain_sum: [],
      showers_sum: [],
      snowfall_sum: [],
      precipitation_hours: [],
      precipitation_probability_max: [],
      wind_gusts_10m_max: [],
      wind_direction_10m_dominant: [],
      shortwave_radiation_sum: [],
      et0_fao_evapotranspiration: [],
    };

    const dailyDataAggregator: Record<string, any[]> = {};
    hourly.time.forEach((isoTime, index) => {
      const dayKey = formatISO(startOfDay(parseISO(isoTime)), { representation: 'date' });
      if (!dailyDataAggregator[dayKey]) {
        dailyDataAggregator[dayKey] = [];
      }
      dailyDataAggregator[dayKey].push({
        temp: hourly.temperature_2m[index],
        precip: hourly.precipitation[index],
        weather_code: hourly.weather_code[index],
        wind_speed: hourly.wind_speed_10m[index],
        wind_gust: hourly.wind_gusts_10m![index],
        wind_dir: hourly.wind_direction_10m[index],
        is_rain: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_rain,
        is_snow: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_snow,
        is_showers: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_showers,
      });
    });

    Object.keys(dailyDataAggregator).sort().slice(0, 7).forEach(dayKey => {
      const dayHoursData = dailyDataAggregator[dayKey];
      daily.time.push(dayKey);

      const temps = dayHoursData.map(h => h.temp).filter(t => t !== null) as number[];
      daily.temperature_2m_max.push(temps.length > 0 ? Math.max(...temps) : null);
      daily.temperature_2m_min.push(temps.length > 0 ? Math.min(...temps) : null);

      const precips = dayHoursData.map(h => h.precip).filter(p => p !== null) as number[];
      const totalPrecip = precips.reduce((sum, p) => sum + p, 0);
      daily.precipitation_sum.push(totalPrecip > 0 ? totalPrecip : null );
      daily.rain_sum!.push(dayHoursData.filter(h=>h.is_rain).reduce((sum, p) => sum + (p.precip || 0), 0));
      daily.showers_sum!.push(dayHoursData.filter(h=>h.is_showers).reduce((sum, p) => sum + (p.precip || 0), 0));
      daily.snowfall_sum!.push(dayHoursData.filter(h=>h.is_snow).reduce((sum, p) => sum + (p.precip || 0), 0));


      daily.precipitation_hours!.push(precips.filter(p => p > 0).length);
      
      // Determine dominant weather code for the day (e.g., most frequent, or priority)
      const weatherCodes = dayHoursData.map(h => h.weather_code).filter(c => c !== null) as number[];
      if (weatherCodes.length > 0) {
        const counts: Record<number, number> = {};
        let maxCount = 0;
        let dominantCode = weatherCodes[0];
        weatherCodes.forEach(code => {
          counts[code] = (counts[code] || 0) + 1;
          if (counts[code] > maxCount) {
            maxCount = counts[code];
            dominantCode = code;
          }
        });
        daily.weather_code.push(dominantCode);
      } else {
        daily.weather_code.push(null);
      }

      const windSpeeds = dayHoursData.map(h => h.wind_speed).filter(ws => ws !== null) as number[];
      daily.wind_speed_10m_max.push(windSpeeds.length > 0 ? Math.max(...windSpeeds) : null);
      
      const windGusts = dayHoursData.map(h => h.wind_gust).filter(wg => wg !== null) as number[];
      daily.wind_gusts_10m_max!.push(windGusts.length > 0 ? Math.max(...windGusts) : null);

      // Optional fields with nulls
      daily.apparent_temperature_max!.push(null);
      daily.apparent_temperature_min!.push(null);
      daily.sunrise!.push(new Date().toISOString()); // Fallback, MET.no doesn't provide
      daily.sunset!.push(new Date().toISOString());  // Fallback
      daily.uv_index_max!.push(null);
      daily.uv_index_clear_sky_max!.push(null);
      daily.precipitation_probability_max!.push(null);
      daily.wind_direction_10m_dominant!.push(null); // Could be implemented by finding most frequent
      daily.shortwave_radiation_sum!.push(null);
      daily.et0_fao_evapotranspiration!.push(null);
    });


    return {
      latitude: rawData.geometry.coordinates[1],
      longitude: rawData.geometry.coordinates[0],
      elevation: rawData.geometry.coordinates[2],
      generationtime_ms: rawData.properties.meta.updated_at ? new Date(rawData.properties.meta.updated_at).getTime() : undefined,
      current,
      hourly,
      daily,
      api_source: "MET Norway",
    };

  } catch (error) {
    console.error('Error fetching or processing weather data from MET.no:', error);
    return null;
  }
}
