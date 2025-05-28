
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { StoredNotification } from '@/types/notifications';
import { useStoredNotifications } from './useStoredNotifications';
import { getWeatherInfo } from '@/lib/weatherIcons';

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
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
  icon?: string;
  tag?: string;
}

async function showNotificationViaSW(title: string, options: NotificationOptions) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    // Check if we have permission before trying to show
    if (Notification.permission === 'granted') {
        await registration.showNotification(title, options);
        console.log("SW Notification displayed:", title, options);
    } else {
        console.warn("Notification permission not granted. Cannot show SW notification.");
    }
  } catch (error) {
    console.error('Error showing notification via SW:', error);
  }
}


export function useWeatherNotificationManager() {
  const { favorites } = useFavorites();
  const { addNotification } = useStoredNotifications();
  const [isManagerActive, setIsManagerActive] = useState(false);

  const checkAndNotify = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log("WeatherNotificationManager: Browser does not support Service Worker or window is undefined.");
        return;
    }

    const notificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
    // We must rely on Notification.permission as it's the source of truth for permission status
    const permission = Notification.permission;

    if (!notificationsEnabled || permission !== 'granted' || favorites.length === 0) {
      console.log(`WeatherNotificationManager: Skipping check. Enabled: ${notificationsEnabled}, Permission: ${permission}, Favorites: ${favorites.length}`);
      return;
    }

    console.log('WeatherNotificationManager: Checking weather for notifications for favorites:', favorites);

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
        const dailyWeatherCodeInfo = getWeatherInfo(dailyToday.weather_code?.[todayIndex] ?? 0, true); // Assume day for daily summary icon
        const defaultIcon = '/logo.png'; // Ensure this exists in /public

        // Current Severe Events
        if (SEVERE_WEATHER_THRESHOLDS.STORM_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Fırtına Uyarısı", details: currentCodeInfo.description, type: 'alert', link, icon: defaultIcon, tag: `storm-${fav.province}-${fav.district}` });
        } else if (SEVERE_WEATHER_THRESHOLDS.HAIL_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Dolu Uyarısı", details: currentCodeInfo.description, type: 'alert', link, icon: defaultIcon, tag: `hail-${fav.province}-${fav.district}` });
        } else if (SEVERE_WEATHER_THRESHOLDS.FREEZING_RAIN_CODES.includes(currentToday.weather_code)) {
          events.push({ locationName, condition: "Donan Yağmur Uyarısı", details: currentCodeInfo.description, type: 'alert', link, icon: defaultIcon, tag: `fr-${fav.province}-${fav.district}` });
        }

        // Daily Summaries for Alerts
        if ((dailyToday.precipitation_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM) {
          events.push({ locationName, condition: "Şiddetli Yağmur Bekleniyor", details: `Günlük Toplam: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm`, type: 'alert', link, icon: defaultIcon, tag: `heavyrain-${fav.province}-${fav.district}` });
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
          events.push({ locationName, condition: "Yoğun Kar Yağışı Bekleniyor", details: `Günlük Toplam: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm`, type: 'alert', link, icon: defaultIcon, tag: `heavysnow-${fav.province}-${fav.district}` });
        }
        if ((dailyToday.wind_speed_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_WIND_KMH) {
          events.push({ locationName, condition: "Şiddetli Rüzgar Bekleniyor", details: `Max Hız: ${dailyToday.wind_speed_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link, icon: defaultIcon, tag: `strongwind-${fav.province}-${fav.district}` });
        }
        if ((dailyToday.wind_gusts_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_GUST_KMH) {
          events.push({ locationName, condition: "Çok Şiddetli Rüzgar Hamlesi Bekleniyor", details: `Max Hamle: ${dailyToday.wind_gusts_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link, icon: defaultIcon, tag: `stronggust-${fav.province}-${fav.district}` });
        }

        // Informational Notifications
        if ((dailyToday.precipitation_probability_max?.[todayIndex] ?? 0) >= 50 && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) > 0) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Yağmur") && e.type === 'info')) {
                 events.push({ locationName, condition: "Yağmur Beklentisi", details: `Olasılık: %${dailyToday.precipitation_probability_max?.[todayIndex]}, Beklenen Miktar: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm. ${dailyWeatherCodeInfo.description}`, type: 'info', link, icon: defaultIcon, tag: `rain-${fav.province}-${fav.district}` });
            }
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) > 0 && (dailyToday.snowfall_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
             if (!events.some(e => e.locationName === locationName && e.condition.includes("Kar") && e.type === 'info')) {
                events.push({ locationName, condition: "Kar Yağışı Beklentisi", details: `Beklenen Miktar: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm. ${dailyWeatherCodeInfo.description}`, type: 'info', link, icon: defaultIcon, tag: `snow-${fav.province}-${fav.district}` });
            }
        }
         if (SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(currentToday.weather_code) || SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(dailyToday.weather_code?.[todayIndex] ?? -1)) {
            if (!events.some(e => e.locationName === locationName && e.condition.includes("Sis") && e.type === 'info')) {
                events.push({ locationName, condition: "Sis Beklentisi", details: `${currentCodeInfo.description} / ${dailyWeatherCodeInfo.description}`, type: 'info', link, icon: defaultIcon, tag: `fog-${fav.province}-${fav.district}` });
            }
        }
      } catch (error) {
        console.error(`WeatherNotificationManager: Error fetching weather data for ${fav.district}:`, error);
      }
    }

    events.forEach(event => {
      showNotificationViaSW(`Hava Durumu: ${event.locationName}`, {
        body: `${event.condition}. ${event.details}`,
        icon: event.icon || defaultIcon,
        tag: event.tag || `weather-${event.type}-${Date.now()}`,
        data: { url: event.link }
      });

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

    const checkInitialStatusAndPermission = () => {
        const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
        // Directly check Notification.permission for the most up-to-date status
        const permission = Notification.permission;
        // setCurrentNotificationPermission(permission); // This line was causing the error and is removed
        setIsManagerActive(enabled && permission === 'granted');
    }

    checkInitialStatusAndPermission();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_ENABLED_KEY) {
        checkInitialStatusAndPermission();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let permissionStatus: PermissionStatus | null = null;
    const handlePermissionChange = () => {
        console.log("WeatherNotificationManager: Notification permission changed to: ", Notification.permission);
        checkInitialStatusAndPermission();
    };

    if (navigator.permissions) {
        navigator.permissions.query({name: 'notifications'}).then((ps) => {
            permissionStatus = ps;
            permissionStatus.onchange = handlePermissionChange;
        }).catch(err => console.error("Error querying notification permissions:", err));
    }


    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive && favorites.length > 0) {
      checkAndNotify();
      intervalId = setInterval(checkAndNotify, POLLING_INTERVAL);
      console.log('WeatherNotificationManager: Started polling.');
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log(`WeatherNotificationManager: Polling not started (Manager Active: ${isManagerActive}, Fav Count: ${favorites.length}, Permission: ${Notification.permission})`);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
      console.log('WeatherNotificationManager: Cleaned up.');
    };
  }, [isManagerActive, favorites, checkAndNotify]);

  return null;
}

export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null;
}
    