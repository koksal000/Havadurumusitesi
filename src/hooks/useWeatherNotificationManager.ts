
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { StoredNotification } from '@/types/notifications';
import { useStoredNotifications } from './useStoredNotifications';
import { getWeatherInfo } from '@/lib/weatherIcons';

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
const NOTIFICATION_PERMISSION_KEY = 'havadurumux-notification-permission';
const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Define thresholds for severe weather
const SEVERE_WEATHER_THRESHOLDS = {
  HEAVY_RAIN_MM: 15, // mm in 24h for daily precipitation_sum
  STRONG_WIND_KMH: 50, // km/h for daily wind_speed_10m_max
  STRONG_GUST_KMH: 75, // km/h for daily wind_gusts_10m_max
  HEAVY_SNOW_CM: 5,  // cm in 24h for daily snowfall_sum
  STORM_CODES: [95, 96, 99], 
  HAIL_CODES: [96, 99],
  FOG_CODES: [45, 48],
  FREEZING_RAIN_CODES: [56, 57, 66, 67],
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
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const notificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
    const permission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;

    if (!notificationsEnabled || permission !== 'granted' || favorites.length === 0) {
      return;
    }

    console.log('Checking weather for notifications for favorites:', favorites);

    const events: WeatherEvent[] = [];

    for (const fav of favorites) {
      try {
        const weather = await getWeatherData(fav.lat, fav.lon);
        if (!weather || !weather.daily || !weather.current) continue;

        const locationName = `${fav.province} / ${fav.district}`;
        const link = `/konum/${encodeURIComponent(fav.province)}/${encodeURIComponent(fav.district)}`;
        const dailyToday = weather.daily;
        const currentToday = weather.current;
        const todayIndex = 0; // Assuming first entry is today
        
        const currentCodeInfo = getWeatherInfo(currentToday.weather_code, currentToday.is_day === 1);

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
        
        // Informational Notifications (less severe but noteworthy)
        const dailyWeatherCodeInfo = getWeatherInfo(dailyToday.weather_code?.[todayIndex] ?? 0, true); // Assume day for daily summary icon
        
        if ((dailyToday.precipitation_probability_max?.[todayIndex] ?? 0) >= 50 && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Yağmur"))) { // Avoid duplicate rain info
                 events.push({ locationName, condition: "Yağmur Beklentisi", details: `Olasılık: %${dailyToday.precipitation_probability_max?.[todayIndex]}, Beklenen Miktar: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) > 0 && (dailyToday.snowfall_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
             if (!events.some(e => e.locationName === locationName && e.condition.includes("Kar"))) {
                events.push({ locationName, condition: "Kar Yağışı Beklentisi", details: `Beklenen Miktar: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }
         if (SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(currentToday.weather_code) || SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(dailyToday.weather_code?.[todayIndex] ?? -1)) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Sis"))) {
                events.push({ locationName, condition: "Sis Beklentisi", details: `${currentCodeInfo.description} / ${dailyWeatherCodeInfo.description}`, type: 'info', link });
            }
        }


      } catch (error) {
        console.error(`Error fetching weather data for ${fav.district}:`, error);
      }
    }

    events.forEach(event => {
      // Show system notification
      new Notification(`Hava Durumu: ${event.locationName}`, {
        body: `${event.condition}. ${event.details}`,
        icon: '/logo.png', 
      });
      // Store notification
      addNotification({
        type: event.type,
        title: `${event.type === 'alert' ? '⚠️ Uyarı' : 'ℹ️ Bilgi'}: ${event.locationName} - ${event.condition}`,
        body: event.details,
        locationName: event.locationName,
        link: event.link,
      });
    });
  }, [favorites, addNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkInitialStatus = () => {
        const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
        const permission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;
        setIsManagerActive(enabled && permission === 'granted');
    }
    
    checkInitialStatus();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_ENABLED_KEY || event.key === NOTIFICATION_PERMISSION_KEY) {
        checkInitialStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive && favorites.length > 0) {
      checkAndNotify(); 
      intervalId = setInterval(checkAndNotify, POLLING_INTERVAL);
      console.log('Weather notification manager started polling.');
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Weather notification manager stopped polling.');
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      console.log('Weather notification manager cleaned up.');
    };
  }, [isManagerActive, favorites, checkAndNotify]);

  return null; 
}

export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null;
}
