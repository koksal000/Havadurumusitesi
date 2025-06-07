
import type { WeatherData, CurrentWeatherAPI, HourlyWeather, DailyWeather } from '@/types/weather';
import { parseISO, formatISO, startOfDay, eachHourOfInterval, isSameDay, getHours, format } from 'date-fns';

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
      console.error('Failed to fetch weather data from MET.no:', response.status, await response.text());
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
      apparent_temperature: null, 
      is_day: currentSymbolInfo.is_day,
      precipitation: currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0,
      rain: currentSymbolInfo.is_rain ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      showers: currentSymbolInfo.is_showers ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      snowfall: currentSymbolInfo.is_snow ? (currentRaw.data?.next_1_hours?.details?.precipitation_amount ?? 0) : 0,
      weather_code: currentSymbolInfo.wmo,
      cloud_cover: currentRaw.data.instant.details.cloud_area_fraction,
      surface_pressure: currentRaw.data.instant.details.air_pressure_at_sea_level,
      wind_speed_10m: (currentRaw.data.instant.details.wind_speed ?? 0) * M_S_TO_KM_H,
      wind_direction_10m: currentRaw.data.instant.details.wind_from_direction,
      wind_gusts_10m: null, // Initialize as null, to be filled by Open-Meteo
      uv_index: null, 
      visibility: null, 
    };

    const hourly: HourlyWeather = {
      time: [], temperature_2m: [], relative_humidity_2m: [], apparent_temperature: [], precipitation_probability: [],
      precipitation: [], rain: [], showers: [], snowfall: [], weather_code: [], surface_pressure: [],
      cloud_cover: [], visibility: [], wind_speed_10m: [], wind_direction_10m: [], wind_gusts_10m: [],
      uv_index: [], soil_temperature_0cm: [], soil_moisture_0_1cm: [], pressure_msl: [], is_day: []
    };

    const sevenDaysLimit = new Date();
    sevenDaysLimit.setDate(sevenDaysLimit.getDate() + 7);

    for (const entry of timeseries) {
      if (parseISO(entry.time) > sevenDaysLimit) break;
      const details = entry.data?.instant?.details;
      const next1HourDetails = entry.data?.next_1_hours?.details;
      const symbolInfo = getSymbolInfo(entry.data?.next_1_hours?.summary?.symbol_code || entry.data?.next_6_hours?.summary?.symbol_code);

      hourly.time.push(entry.time);
      hourly.temperature_2m.push(details?.air_temperature ?? null);
      hourly.relative_humidity_2m.push(details?.relative_humidity ?? null);
      hourly.precipitation.push(next1HourDetails?.precipitation_amount ?? null);
      hourly.weather_code.push(symbolInfo.wmo);
      hourly.cloud_cover!.push(details?.cloud_area_fraction ?? null);
      hourly.surface_pressure!.push(details?.air_pressure_at_sea_level ?? null);
      hourly.pressure_msl!.push(details?.air_pressure_at_sea_level ?? null); 
      hourly.wind_speed_10m.push(details?.wind_speed !== undefined ? details.wind_speed * M_S_TO_KM_H : null);
      hourly.wind_direction_10m.push(details?.wind_from_direction ?? null);
      hourly.wind_gusts_10m!.push(null); // Initialize as null, to be filled by Open-Meteo
      hourly.is_day!.push(symbolInfo.is_day);
      hourly.rain!.push(symbolInfo.is_rain ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.showers!.push(symbolInfo.is_showers ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      hourly.snowfall!.push(symbolInfo.is_snow ? (next1HourDetails?.precipitation_amount ?? 0) : 0);
      
      hourly.apparent_temperature!.push(null);
      hourly.precipitation_probability!.push(null);
      hourly.uv_index!.push(null);
      hourly.visibility!.push(null);
      hourly.soil_temperature_0cm!.push(null);
      hourly.soil_moisture_0_1cm!.push(null);
    }
    
    const daily: DailyWeather = {
      time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [],
      rain_sum: [], showers_sum: [], snowfall_sum: [], precipitation_hours: [], wind_speed_10m_max: [],
      apparent_temperature_max: [], apparent_temperature_min: [], sunrise: [], sunset: [],
      uv_index_max: [], uv_index_clear_sky_max: [], precipitation_probability_max: [],
      wind_gusts_10m_max: [], wind_direction_10m_dominant: [], shortwave_radiation_sum: [],
      et0_fao_evapotranspiration: []
    };

    const dailyDataAggregator: Record<string, any[]> = {};
    hourly.time.forEach((isoTime, index) => {
      const dayKey = formatISO(startOfDay(parseISO(isoTime)), { representation: 'date' });
      if (!dailyDataAggregator[dayKey]) dailyDataAggregator[dayKey] = [];
      dailyDataAggregator[dayKey].push({
        temp: hourly.temperature_2m[index],
        precip: hourly.precipitation[index],
        weather_code: hourly.weather_code[index],
        wind_speed_kmh: hourly.wind_speed_10m[index],
        is_rain_symbol: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_rain,
        is_snow_symbol: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_snow,
        is_showers_symbol: getSymbolInfo(timeseries[index].data?.next_1_hours?.summary?.symbol_code).is_showers,
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
      daily.rain_sum!.push(dayHoursData.filter(h => h.is_rain_symbol).reduce((sum, h) => sum + (h.precip || 0), 0) || null);
      daily.showers_sum!.push(dayHoursData.filter(h => h.is_showers_symbol).reduce((sum, h) => sum + (h.precip || 0), 0) || null);
      daily.snowfall_sum!.push(dayHoursData.filter(h => h.is_snow_symbol).reduce((sum, h) => sum + (h.precip || 0), 0) || null);
      daily.precipitation_hours!.push(precips.filter(p => p > 0).length || null);
      
      const weatherCodes = dayHoursData.map(h => h.weather_code).filter(c => c !== null) as number[];
      if (weatherCodes.length > 0) {
        const counts: Record<number, number> = {}; let maxCount = 0; let dominantCode = weatherCodes[0];
        weatherCodes.forEach(code => { counts[code] = (counts[code] || 0) + 1; if (counts[code] > maxCount) { maxCount = counts[code]; dominantCode = code; } });
        daily.weather_code.push(dominantCode);
      } else { daily.weather_code.push(null); }

      const windSpeedsKMH = dayHoursData.map(h => h.wind_speed_kmh).filter(ws => ws !== null) as number[];
      daily.wind_speed_10m_max.push(windSpeedsKMH.length > 0 ? Math.max(...windSpeedsKMH) : null);
      
      daily.wind_gusts_10m_max!.push(null); // Initialize as null, to be filled by Open-Meteo

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
  const current_supplement_params = [
    "apparent_temperature", "uv_index", "visibility", "rain", "showers", "snowfall", "wind_gusts_10m", "pressure_msl", "cloud_cover"
  ].join(',');
  const hourly_supplement_params = [
    "apparent_temperature", "uv_index", "visibility", "precipitation_probability",
    "soil_temperature_0cm", "soil_moisture_0_1cm", "rain", "showers", "snowfall", "pressure_msl", "wind_gusts_10m", "cloud_cover"
  ].join(',');
  const daily_supplement_params = [
    "sunrise", "sunset", "uv_index_max", "uv_index_clear_sky_max",
    "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_max",
    "wind_direction_10m_dominant", "shortwave_radiation_sum", "et0_fao_evapotranspiration",
    "rain_sum", "showers_sum", "snowfall_sum", "precipitation_hours", "wind_gusts_10m_max"
  ].join(',');

  let openMeteoUrl = `${OPEN_METEO_API_BASE_URL}?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=7`;
  openMeteoUrl += `&current=${current_supplement_params}`;
  openMeteoUrl += `&hourly=${hourly_supplement_params}`;
  openMeteoUrl += `&daily=${daily_supplement_params}`;
  
  try {
    const response = await fetch(openMeteoUrl);
    if (!response.ok) {
      console.error('Failed to fetch supplementary data from Open-Meteo:', response.status, await response.text());
      return existingWeatherData; 
    }
    const openMeteoData = await response.json();

    // --- Merge Current Data ---
    if (openMeteoData.current) {
        const omCurrent = openMeteoData.current;
        const exCurrent = existingWeatherData.current;

        if (exCurrent.apparent_temperature === null && omCurrent.apparent_temperature !== undefined && omCurrent.apparent_temperature !== null) exCurrent.apparent_temperature = omCurrent.apparent_temperature;
        if (exCurrent.uv_index === null && omCurrent.uv_index !== undefined && omCurrent.uv_index !== null) exCurrent.uv_index = omCurrent.uv_index;
        if (exCurrent.visibility === null && omCurrent.visibility !== undefined && omCurrent.visibility !== null) exCurrent.visibility = omCurrent.visibility;
        if (omCurrent.pressure_msl !== undefined && omCurrent.pressure_msl !== null) exCurrent.surface_pressure = omCurrent.pressure_msl; 
        if (omCurrent.cloud_cover !== undefined && omCurrent.cloud_cover !== null) exCurrent.cloud_cover = omCurrent.cloud_cover;

        if ((exCurrent.rain === null || exCurrent.rain === 0) && omCurrent.rain !== undefined && omCurrent.rain !== null && omCurrent.rain > 0) exCurrent.rain = omCurrent.rain;
        if ((exCurrent.showers === null || exCurrent.showers === 0) && omCurrent.showers !== undefined && omCurrent.showers !== null && omCurrent.showers > 0) exCurrent.showers = omCurrent.showers;
        if ((exCurrent.snowfall === null || exCurrent.snowfall === 0) && omCurrent.snowfall !== undefined && omCurrent.snowfall !== null && omCurrent.snowfall > 0) exCurrent.snowfall = omCurrent.snowfall;
        
        // Directly assign wind_gusts_10m from Open-Meteo
        exCurrent.wind_gusts_10m = omCurrent.wind_gusts_10m ?? null;
    }

    // --- Merge Hourly Data ---
    if (openMeteoData.hourly && openMeteoData.hourly.time) {
      existingWeatherData.hourly.time.forEach((metTimeISO, index) => {
        const metTime = parseISO(metTimeISO);
        const omHourlyIndex = openMeteoData.hourly.time.findIndex((omTimeISO: string) => parseISO(omTimeISO).getTime() === metTime.getTime());

        if (omHourlyIndex !== -1) {
          const omHour = openMeteoData.hourly;
          const exHour = existingWeatherData.hourly;

          if (exHour.apparent_temperature![index] === null && omHour.apparent_temperature?.[omHourlyIndex] !== undefined && omHour.apparent_temperature?.[omHourlyIndex] !== null) exHour.apparent_temperature![index] = omHour.apparent_temperature[omHourlyIndex];
          if (exHour.uv_index![index] === null && omHour.uv_index?.[omHourlyIndex] !== undefined && omHour.uv_index?.[omHourlyIndex] !== null) exHour.uv_index![index] = omHour.uv_index[omHourlyIndex];
          if (exHour.visibility![index] === null && omHour.visibility?.[omHourlyIndex] !== undefined && omHour.visibility?.[omHourlyIndex] !== null) exHour.visibility![index] = omHour.visibility[omHourlyIndex];
          if (exHour.precipitation_probability![index] === null && omHour.precipitation_probability?.[omHourlyIndex] !== undefined && omHour.precipitation_probability?.[omHourlyIndex] !== null) exHour.precipitation_probability![index] = omHour.precipitation_probability[omHourlyIndex];
          if (exHour.soil_temperature_0cm![index] === null && omHour.soil_temperature_0cm?.[omHourlyIndex] !== undefined && omHour.soil_temperature_0cm?.[omHourlyIndex] !== null) exHour.soil_temperature_0cm![index] = omHour.soil_temperature_0cm[omHourlyIndex];
          if (exHour.soil_moisture_0_1cm![index] === null && omHour.soil_moisture_0_1cm?.[omHourlyIndex] !== undefined && omHour.soil_moisture_0_1cm?.[omHourlyIndex] !== null) exHour.soil_moisture_0_1cm![index] = omHour.soil_moisture_0_1cm[omHourlyIndex];
          if (omHour.pressure_msl?.[omHourlyIndex] !== undefined && omHour.pressure_msl?.[omHourlyIndex] !== null) exHour.pressure_msl![index] = omHour.pressure_msl[omHourlyIndex];
          if (omHour.cloud_cover?.[omHourlyIndex] !== undefined && omHour.cloud_cover?.[omHourlyIndex] !== null) exHour.cloud_cover![index] = omHour.cloud_cover[omHourlyIndex];
          
          if ((exHour.rain![index] === null || exHour.rain![index] === 0) && omHour.rain?.[omHourlyIndex] !== undefined && omHour.rain?.[omHourlyIndex] !== null && omHour.rain[omHourlyIndex] > 0) exHour.rain![index] = omHour.rain[omHourlyIndex];
          if ((exHour.showers![index] === null || exHour.showers![index] === 0) && omHour.showers?.[omHourlyIndex] !== undefined && omHour.showers?.[omHourlyIndex] !== null && omHour.showers[omHourlyIndex] > 0) exHour.showers![index] = omHour.showers[omHourlyIndex];
          if ((exHour.snowfall![index] === null || exHour.snowfall![index] === 0) && omHour.snowfall?.[omHourlyIndex] !== undefined && omHour.snowfall?.[omHourlyIndex] !== null && omHour.snowfall[omHourlyIndex] > 0) exHour.snowfall![index] = omHour.snowfall[omHourlyIndex];
          
          // Directly assign hourly wind_gusts_10m from Open-Meteo
          exHour.wind_gusts_10m![index] = omHour.wind_gusts_10m?.[omHourlyIndex] ?? null;
        }
      });
    }

    // --- Merge Daily Data ---
    if (openMeteoData.daily && openMeteoData.daily.time) {
      existingWeatherData.daily.time.forEach((metDateStr, index) => {
        const omDailyIndex = openMeteoData.daily.time.findIndex((omDateStr: string) => omDateStr === metDateStr);
        if (omDailyIndex !== -1) {
          const omDaily = openMeteoData.daily;
          const exDaily = existingWeatherData.daily;

          const fieldsToMergeIfNull: (keyof DailyWeather)[] = [
            'sunrise', 'sunset', 'uv_index_max', 'uv_index_clear_sky_max', 
            'apparent_temperature_max', 'apparent_temperature_min', 'precipitation_probability_max',
            'wind_direction_10m_dominant', 'shortwave_radiation_sum', 'et0_fao_evapotranspiration',
            'precipitation_hours'
          ];
          fieldsToMergeIfNull.forEach(field => {
            const omValue = (omDaily[field] as any)?.[omDailyIndex];
            if ((exDaily[field]![index] === null || exDaily[field]![index] === undefined) && omValue !== undefined && omValue !== null) {
                (exDaily[field] as any)![index] = omValue;
            }
          });

          const dailyRainSumOM = (omDaily.rain_sum as any)?.[omDailyIndex];
          if (((exDaily.rain_sum as any)![index] === null || (exDaily.rain_sum as any)![index] === 0) && dailyRainSumOM !== undefined && dailyRainSumOM !== null && dailyRainSumOM > 0) (exDaily.rain_sum as any)![index] = dailyRainSumOM;
          
          const dailyShowersSumOM = (omDaily.showers_sum as any)?.[omDailyIndex];
          if (((exDaily.showers_sum as any)![index] === null || (exDaily.showers_sum as any)![index] === 0) && dailyShowersSumOM !== undefined && dailyShowersSumOM !== null && dailyShowersSumOM > 0) (exDaily.showers_sum as any)![index] = dailyShowersSumOM;

          const dailySnowfallSumOM = (omDaily.snowfall_sum as any)?.[omDailyIndex];
          if (((exDaily.snowfall_sum as any)![index] === null || (exDaily.snowfall_sum as any)![index] === 0) && dailySnowfallSumOM !== undefined && dailySnowfallSumOM !== null && dailySnowfallSumOM > 0) (exDaily.snowfall_sum as any)![index] = dailySnowfallSumOM;

          // Directly assign daily wind_gusts_10m_max from Open-Meteo
          (exDaily.wind_gusts_10m_max as any)![index] = (omDaily.wind_gusts_10m_max as (number | null)[])?.[omDailyIndex] ?? null;
        }
      });
    }
    existingWeatherData.api_source = "MET Norway / Open-Meteo"; 
    return existingWeatherData;

  } catch (error) {
    console.error('Error fetching or processing supplementary data from Open-Meteo:', error);
    return existingWeatherData; 
  }
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const metData = await fetchFromMetNorway(lat, lon);
  if (!metData) {
    console.warn("Primary API (MET Norway) failed. No data to supplement.");
    // Potentially, you could attempt a direct Open-Meteo fetch here as a full fallback,
    // but that would require mapping Open-Meteo's entire response structure to WeatherData.
    // For now, sticking to the original plan of MET as primary.
    return null;
  }
  
  const supplementedData = await fetchSupplementaryFromOpenMeteo(lat, lon, metData);
  return supplementedData;
}

