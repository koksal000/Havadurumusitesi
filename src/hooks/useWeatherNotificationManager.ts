
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { StoredNotification } from '@/types/notifications';
import { useStoredNotifications } from './useStoredNotifications';
import { getWeatherInfo } from '@/lib/weatherIcons';

const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes

const SEVERE_WEATHER_THRESHOLDS = {
  HEAVY_RAIN_MM: 15,
  STRONG_WIND_KMH: 50,
  STRONG_GUST_KMH: 75,
  HEAVY_SNOW_CM: 5,
  STORM_CODES: [95, 96, 99], // thunderstorms
  HAIL_CODES: [96, 99], // thunderstorms with hail
  FOG_CODES: [45, 48], // fog and depositing rime fog
  FREEZING_RAIN_CODES: [56, 57, 66, 67], // freezing drizzle and rain
};

interface WeatherEvent {
  locationName: string;
  condition: string;
  details: string;
  type: StoredNotification['type'];
  link: string;
}

export function useWeatherNotificationManager() {
  const { favorites } = useFavorites();
  const { addNotification } = useStoredNotifications();
  const [isManagerActive, setIsManagerActive] = useState(false);

  const checkAndNotify = useCallback(async () => {
    if (favorites.length === 0) {
      console.log("WeatherNotificationManager (In-App): Skipping check. No favorites.");
      return;
    }

    console.log('WeatherNotificationManager (In-App): Checking weather for notifications for favorites:', favorites);

    const events: WeatherEvent[] = [];

    for (const fav of favorites) {
      try {
        const weather = await getWeatherData(fav.lat, fav.lon);
        if (!weather || !weather.daily || !weather.current) continue;

        const locationName = `${fav.province} / ${fav.district}`;
        const link = `/konum/${encodeURIComponent(fav.province)}/${encodeURIComponent(fav.district)}`;
        const dailyToday = weather.daily;
        const currentToday = weather.current;
        const todayIndex = 0;

        const currentCodeInfo = getWeatherInfo(currentToday.weather_code, currentToday.is_day === 1);
        const dailyWeatherCodeInfo = getWeatherInfo(dailyToday.weather_code?.[todayIndex] ?? 0, true);

        // Current Severe Events
        if (SEVERE_WEATHER_THRESHOLDS.STORM_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Fırtına Uyarısı", details: currentCodeInfo.description, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.HAIL_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Dolu Uyarısı", details: currentCodeInfo.description, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.FREEZING_RAIN_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Donan Yağmur Uyarısı", details: currentCodeInfo.description, type: 'alert', link });
        }

        // Daily Summaries for Alerts
        if ((dailyToday.precipitation_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM) {
          events.push({ locationName, condition: "Şiddetli Yağmur Bekleniyor", details: `Günlük Toplam: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm`, type: 'alert', link });
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
          events.push({ locationName, condition: "Yoğun Kar Yağışı Bekleniyor", details: `Günlük Toplam: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm`, type: 'alert', link });
        }
        if ((dailyToday.wind_speed_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_WIND_KMH) {
          events.push({ locationName, condition: "Şiddetli Rüzgar Bekleniyor", details: `Max Hız: ${dailyToday.wind_speed_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link });
        }
        if ((dailyToday.wind_gusts_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_GUST_KMH) {
          events.push({ locationName, condition: "Çok Şiddetli Rüzgar Hamlesi Bekleniyor", details: `Max Hamle: ${dailyToday.wind_gusts_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link });
        }

        // Informational Notifications
        if ((dailyToday.precipitation_probability_max?.[todayIndex] ?? 0) >= 50 && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) > 0) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Yağmur") && e.type === 'info')) {
                 events.push({ locationName, condition: "Yağmur Beklentisi", details: `Olasılık: %${dailyToday.precipitation_probability_max?.[todayIndex]}, Beklenen Miktar: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) > 0 && (dailyToday.snowfall_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
             if (!events.some(e => e.locationName === locationName && e.condition.includes("Kar") && e.type === 'info')) {
                events.push({ locationName, condition: "Kar Yağışı Beklentisi", details: `Beklenen Miktar: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }
         if (SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(currentToday.weather_code) || SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(dailyToday.weather_code?.[todayIndex] ?? -1)) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Sis") && e.type === 'info')) {
                events.push({ locationName, condition: "Sis Beklentisi", details: `${currentCodeInfo.description} / ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }
      } catch (error) {
        console.error(`WeatherNotificationManager (In-App): Error fetching weather data for ${fav.district}:`, error);
      }
    }

    events.forEach(event => {
      addNotification({
        type: event.type,
        title: `${event.type === 'alert' ? '⚠️ Uyarı' : 'ℹ️ Bilgi'}: ${event.locationName} - ${event.condition}`,
        body: event.details,
        locationName: event.locationName,
        link: event.link,
      });
      console.log(`WeatherNotificationManager (In-App): Added in-app notification for ${event.locationName}: ${event.condition}`)
    });
  }, [favorites, addNotification]);

  useEffect(() => {
    // Manager is active if there are favorites to check.
    setIsManagerActive(favorites.length > 0);
  }, [favorites]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive) {
      checkAndNotify(); // Initial check
      intervalId = setInterval(checkAndNotify, POLLING_INTERVAL);
      console.log('WeatherNotificationManager (In-App): Started polling for in-app notifications.');
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log(`WeatherNotificationManager (In-App): Polling not started (Manager Active: ${isManagerActive}, Fav Count: ${favorites.length})`);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      console.log('WeatherNotificationManager (In-App): Cleaned up.');
    };
  }, [isManagerActive, checkAndNotify]); // checkAndNotify is now a dependency

  return null;
}

export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null;
}
    

    