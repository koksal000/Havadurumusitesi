
import type { WeatherData, CurrentWeatherAPI, HourlyWeather, DailyWeather } from '@/types/weather';
import { parseISO, formatISO, startOfDay, endOfDay, eachHourOfInterval, isSameDay, getHours, format } from 'date-fns';

const MET_API_BASE_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const MET_USER_AGENT = 'havadurumuxsite/1.0 havadurumuxsite@gmail.com';
const OPEN_METEO_API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const M_S_TO_KM_H = 3.6;

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
  'heavyrainshowersandthunder_day': { wmo: 97, is_showers: true, is_rain: true }, 'heavyrainshowersandthunder_night': { wmo: 97, is_showers: true, is_rain: true },
  'lightsleetshowers_day': { wmo: 83, is_showers: true }, 'lightsleetshowers_night': { wmo: 83, is_showers: true },
  'sleetshowers_day': { wmo: 83, is_showers: true }, 'sleetshowers_night': { wmo: 83, is_showers: true },
  'heavysleetshowers_day': { wmo: 84, is_showers: true }, 'heavysleetshowers_night': { wmo: 84, is_showers: true },
  'lightsnowshowers_day': { wmo: 85, is_showers: true, is_snow: true }, 'lightsnowshowers_night': { wmo: 85, is_showers: true, is_snow: true },
  'snowshowers_day': { wmo: 85, is_showers: true, is_snow: true }, 'snowshowers_night': { wmo: 85, is_showers: true, is_snow: true },
  'heavysnowshowers_day': { wmo: 86, is_showers: true, is_snow: true }, 'heavysnowshowers_night': { wmo: 86, is_showers: true, is_snow: true },
  'lightrain': { wmo: 61, is_rain: true }, 'rain': { wmo: 63, is_rain: true }, 'heavyrain': { wmo: 65, is_rain: true },
  'lightrainandthunder': { wmo: 95, is_rain: true }, 'rainandthunder': { wmo: 95, is_rain: true }, 'heavyrainandthunder': { wmo: 97, is_rain: true },
  'lightsleet': { wmo: 67 }, 'sleet': { wmo: 67 }, 'heavysleet': { wmo: 67 },
  'lightsnow': { wmo: 71, is_snow: true }, 'snow': { wmo: 73, is_snow: true }, 'heavysnow': { wmo: 75, is_snow: true },
  'lightsnowandthunder': { wmo: 95, is_snow: true }, 'snowandthunder': { wmo: 95, is_snow: true }, 'heavysnowandthunder': { wmo: 97, is_snow: true },
  'fog': { wmo: 45 },
  'unknown': { wmo: 0 }
};

function getSymbolInfo(symbolCode?: string): { wmo: number; is_day: number; is_rain?: boolean; is_snow?: boolean; is_showers?: boolean } {
  if (!symbolCode) return { wmo: metSymbolToWMOCode['unknown'].wmo, is_day: 1 };
  const mapping = metSymbolToWMOCode[symbolCode.toLowerCase()] || metSymbolToWMOCode['unknown'];
  const is_day = symbolCode.toLowerCase().includes('_day') ? 1 : (symbolCode.toLowerCase().includes('_night') ? 0 : 1);
  return { ...mapping, is_day };
}

async function fetchFromMetNorway(lat: number, lon: number): Promise<WeatherData | null> {
  const params = new URLSearchParams({ lat: lat.toString(), lon: lon.toString() });
  try {
    const response = await fetch(`${MET_API_BASE_URL}?${params.toString()}`, {
      headers: { 'User-Agent': MET_USER_AGENT },
    });
    if (!response.ok) {
      console.error('Failed to fetch weather data from MET.no:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Error response body from MET.no:', errorBody);
      return null;
    }
    const rawData = await response.json();
    if (!rawData.properties || !rawData.properties.timeseries || rawData.properties.timeseries.length === 0) {
      console.error('MET.no data is not in expected format or timeseries is empty:', rawData);
      return null;
    }

    const timeseries = rawData.properties.timeseries;
    const currentRaw = timeseries[0];
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
      apparent_temperature: null, uv_index: null, visibility: null,
      rain: currentSymbolInfo.is_rain ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      showers: currentSymbolInfo.is_showers ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      snowfall: currentSymbolInfo.is_snow ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
    };

    const hourly: HourlyWeather = {
      time: [], temperature_2m: [], relative_humidity_2m: [], precipitation: [], weather_code: [],
      cloud_cover: [], surface_pressure: [], wind_speed_10m: [], wind_direction_10m: [],
      wind_gusts_10m: [], is_day: [], apparent_temperature: [], precipitation_probability: [],
      uv_index: [], pressure_msl: [], visibility: [], rain: [], showers: [], snowfall: [],
      soil_temperature_0cm: [], soil_moisture_0_1cm: []
    };

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const entry of timeseries) {
      if (parseISO(entry.time) > sevenDaysFromNow) break;
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
      hourly.apparent_temperature!.push(null); hourly.precipitation_probability!.push(null);
      hourly.uv_index!.push(null); hourly.visibility!.push(null);
      hourly.rain!.push(symbolInfo.is_rain ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.showers!.push(symbolInfo.is_showers ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.snowfall!.push(symbolInfo.is_snow ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.soil_temperature_0cm!.push(null); hourly.soil_moisture_0_1cm!.push(null);
    }
    
    const daily: DailyWeather = {
      time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [],
      wind_speed_10m_max: [], apparent_temperature_max: [], apparent_temperature_min: [], sunrise: [],
      sunset: [], uv_index_max: [], uv_index_clear_sky_max: [], rain_sum: [], showers_sum: [],
      snowfall_sum: [], precipitation_hours: [], precipitation_probability_max: [], wind_gusts_10m_max: [],
      wind_direction_10m_dominant: [], shortwave_radiation_sum: [], et0_fao_evapotranspiration: [],
    };

    const dailyDataAggregator: Record<string, any[]> = {};
    hourly.time.forEach((isoTime, index) => {
      const dayKey = formatISO(startOfDay(parseISO(isoTime)), { representation: 'date' });
      if (!dailyDataAggregator[dayKey]) dailyDataAggregator[dayKey] = [];
      dailyDataAggregator[dayKey].push({
        temp: hourly.temperature_2m[index], precip: hourly.precipitation[index],
        weather_code: hourly.weather_code[index], wind_speed: hourly.wind_speed_10m[index],
        wind_gust: hourly.wind_gusts_10m![index],
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
      daily.precipitation_sum.push(totalPrecip > 0 ? totalPrecip : null);
      daily.rain_sum!.push(dayHoursData.filter(h=>h.is_rain).reduce((sum, p) => sum + (p.precip || 0), 0) || null);
      daily.showers_sum!.push(dayHoursData.filter(h=>h.is_showers).reduce((sum, p) => sum + (p.precip || 0), 0) || null);
      daily.snowfall_sum!.push(dayHoursData.filter(h=>h.is_snow).reduce((sum, p) => sum + (p.precip || 0), 0) || null);
      daily.precipitation_hours!.push(precips.filter(p => p > 0).length || null);
      
      const weatherCodes = dayHoursData.map(h => h.weather_code).filter(c => c !== null) as number[];
      if (weatherCodes.length > 0) {
        const counts: Record<number, number> = {}; let maxCount = 0; let dominantCode = weatherCodes[0];
        weatherCodes.forEach(code => { counts[code] = (counts[code] || 0) + 1; if (counts[code] > maxCount) { maxCount = counts[code]; dominantCode = code; }});
        daily.weather_code.push(dominantCode);
      } else { daily.weather_code.push(null); }
      const windSpeeds = dayHoursData.map(h => h.wind_speed).filter(ws => ws !== null) as number[];
      daily.wind_speed_10m_max.push(windSpeeds.length > 0 ? Math.max(...windSpeeds) : null);
      const windGusts = dayHoursData.map(h => h.wind_gust).filter(wg => wg !== null) as number[];
      daily.wind_gusts_10m_max!.push(windGusts.length > 0 ? Math.max(...windGusts) : null);

      daily.apparent_temperature_max!.push(null); daily.apparent_temperature_min!.push(null);
      daily.sunrise!.push(null); daily.sunset!.push(null); daily.uv_index_max!.push(null);
      daily.uv_index_clear_sky_max!.push(null); daily.precipitation_probability_max!.push(null);
      daily.wind_direction_10m_dominant!.push(null); daily.shortwave_radiation_sum!.push(null);
      daily.et0_fao_evapotranspiration!.push(null);
    });

    return {
      latitude: rawData.geometry.coordinates[1], longitude: rawData.geometry.coordinates[0],
      elevation: rawData.geometry.coordinates[2],
      generationtime_ms: rawData.properties.meta.updated_at ? new Date(rawData.properties.meta.updated_at).getTime() : undefined,
      current, hourly, daily, api_source: "MET Norway",
    };
  } catch (error) {
    console.error('Error fetching or processing weather data from MET.no:', error);
    return null;
  }
}

async function fetchSupplementaryFromOpenMeteo(lat: number, lon: number, existingWeatherData: WeatherData): Promise<WeatherData> {
  const hourly_params = [
    "apparent_temperature", "uv_index", "visibility", "precipitation_probability",
    "soil_temperature_0cm", "soil_moisture_0_1cm"
  ].filter(p => { // Only request if largely missing in existing hourly data
      const key = p as keyof HourlyWeather;
      return !existingWeatherData.hourly[key] || (existingWeatherData.hourly[key] as (number|null)[])?.every(v => v === null);
  }).join(',');

  const daily_params = [
    "sunrise", "sunset", "uv_index_max", "uv_index_clear_sky_max", 
    "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_max",
    "shortwave_radiation_sum", "et0_fao_evapotranspiration"
  ].filter(p => { // Only request if largely missing in existing daily data
      const key = p as keyof DailyWeather;
      return !existingWeatherData.daily[key] || (existingWeatherData.daily[key] as (string|number|null)[])?.every(v => v === null);
  }).join(',');

  if (!hourly_params && !daily_params) {
    return existingWeatherData; // Nothing to supplement
  }

  let openMeteoUrl = `${OPEN_METEO_API_BASE_URL}?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=7`;
  if (hourly_params) openMeteoUrl += `&hourly=${hourly_params}`;
  if (daily_params) openMeteoUrl += `&daily=${daily_params}`;
  
  try {
    const response = await fetch(openMeteoUrl);
    if (!response.ok) {
      console.error('Failed to fetch supplementary data from Open-Meteo:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Error response body from Open-Meteo:', errorBody);
      return existingWeatherData; // Return original data if supplementary fetch fails
    }
    const openMeteoData = await response.json();

    // Merge Current Data
    if (openMeteoData.current) { // Open-Meteo compact might not have current, but forecast endpoint does
        const omCurrent = openMeteoData.current_weather || openMeteoData.current; // handle different OM response structures
        if (existingWeatherData.current.apparent_temperature === null && omCurrent.apparent_temperature !== undefined) existingWeatherData.current.apparent_temperature = omCurrent.apparent_temperature;
        if (existingWeatherData.current.uv_index === null && omCurrent.uv_index !== undefined) existingWeatherData.current.uv_index = omCurrent.uv_index;
        if (existingWeatherData.current.visibility === null && omCurrent.visibility !== undefined) existingWeatherData.current.visibility = omCurrent.visibility; // OM visibility is in meters
    }


    // Merge Hourly Data
    if (openMeteoData.hourly && openMeteoData.hourly.time) {
      existingWeatherData.hourly.time.forEach((metTimeISO, index) => {
        const metTime = parseISO(metTimeISO);
        const omHourlyIndex = openMeteoData.hourly.time.findIndex((omTimeISO: string) => parseISO(omTimeISO).getTime() === metTime.getTime());

        if (omHourlyIndex !== -1) {
          if (hourly_params.includes("apparent_temperature") && existingWeatherData.hourly.apparent_temperature![index] === null) existingWeatherData.hourly.apparent_temperature![index] = openMeteoData.hourly.apparent_temperature?.[omHourlyIndex] ?? null;
          if (hourly_params.includes("uv_index") && existingWeatherData.hourly.uv_index![index] === null) existingWeatherData.hourly.uv_index![index] = openMeteoData.hourly.uv_index?.[omHourlyIndex] ?? null;
          if (hourly_params.includes("visibility") && existingWeatherData.hourly.visibility![index] === null) existingWeatherData.hourly.visibility![index] = openMeteoData.hourly.visibility?.[omHourlyIndex] ?? null;
          if (hourly_params.includes("precipitation_probability") && existingWeatherData.hourly.precipitation_probability![index] === null) existingWeatherData.hourly.precipitation_probability![index] = openMeteoData.hourly.precipitation_probability?.[omHourlyIndex] ?? null;
          if (hourly_params.includes("soil_temperature_0cm") && existingWeatherData.hourly.soil_temperature_0cm![index] === null) existingWeatherData.hourly.soil_temperature_0cm![index] = openMeteoData.hourly.soil_temperature_0cm?.[omHourlyIndex] ?? null;
          if (hourly_params.includes("soil_moisture_0_1cm") && existingWeatherData.hourly.soil_moisture_0_1cm![index] === null) existingWeatherData.hourly.soil_moisture_0_1cm![index] = openMeteoData.hourly.soil_moisture_0_1cm?.[omHourlyIndex] ?? null;
        }
      });
    }

    // Merge Daily Data
    if (openMeteoData.daily && openMeteoData.daily.time) {
      existingWeatherData.daily.time.forEach((metDateStr, index) => {
        const omDailyIndex = openMeteoData.daily.time.findIndex((omDateStr: string) => omDateStr === metDateStr);
        if (omDailyIndex !== -1) {
          if (daily_params.includes("sunrise") && existingWeatherData.daily.sunrise![index] === null) existingWeatherData.daily.sunrise![index] = openMeteoData.daily.sunrise?.[omDailyIndex] ?? null;
          if (daily_params.includes("sunset") && existingWeatherData.daily.sunset![index] === null) existingWeatherData.daily.sunset![index] = openMeteoData.daily.sunset?.[omDailyIndex] ?? null;
          if (daily_params.includes("uv_index_max") && existingWeatherData.daily.uv_index_max![index] === null) existingWeatherData.daily.uv_index_max![index] = openMeteoData.daily.uv_index_max?.[omDailyIndex] ?? null;
          if (daily_params.includes("uv_index_clear_sky_max") && existingWeatherData.daily.uv_index_clear_sky_max![index] === null) existingWeatherData.daily.uv_index_clear_sky_max![index] = openMeteoData.daily.uv_index_clear_sky_max?.[omDailyIndex] ?? null;
          if (daily_params.includes("apparent_temperature_max") && existingWeatherData.daily.apparent_temperature_max![index] === null) existingWeatherData.daily.apparent_temperature_max![index] = openMeteoData.daily.apparent_temperature_max?.[omDailyIndex] ?? null;
          if (daily_params.includes("apparent_temperature_min") && existingWeatherData.daily.apparent_temperature_min![index] === null) existingWeatherData.daily.apparent_temperature_min![index] = openMeteoData.daily.apparent_temperature_min?.[omDailyIndex] ?? null;
          if (daily_params.includes("precipitation_probability_max") && existingWeatherData.daily.precipitation_probability_max![index] === null) existingWeatherData.daily.precipitation_probability_max![index] = openMeteoData.daily.precipitation_probability_max?.[omDailyIndex] ?? null;
          if (daily_params.includes("shortwave_radiation_sum") && existingWeatherData.daily.shortwave_radiation_sum![index] === null) existingWeatherData.daily.shortwave_radiation_sum![index] = openMeteoData.daily.shortwave_radiation_sum?.[omDailyIndex] ?? null;
          if (daily_params.includes("et0_fao_evapotranspiration") && existingWeatherData.daily.et0_fao_evapotranspiration![index] === null) existingWeatherData.daily.et0_fao_evapotranspiration![index] = openMeteoData.daily.et0_fao_evapotranspiration?.[omDailyIndex] ?? null;
        }
      });
    }
    existingWeatherData.api_source = "MET Norway / Open-Meteo";
    return existingWeatherData;

  } catch (error) {
    console.error('Error fetching or processing supplementary data from Open-Meteo:', error);
    return existingWeatherData; // Return original data if supplementary fetch fails
  }
}


export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const metData = await fetchFromMetNorway(lat, lon);
  if (!metData) {
    // Optionally, try Open-Meteo as a full fallback here if MET Norway fails completely
    // For now, adhering to "supplement N/A" means MET Norway must succeed first.
    return null;
  }
  
  // Now, supplement with Open-Meteo data
  const supplementedData = await fetchSupplementaryFromOpenMeteo(lat, lon, metData);
  
  return supplementedData;
}
