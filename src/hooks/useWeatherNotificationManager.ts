
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { StoredNotification } from '@/types/notifications';
import { useStoredNotifications } from './useStoredNotifications';
import { getWeatherInfo } from '@/lib/weatherIcons';

const POLLING_INTERVAL = 60 * 60 * 1000; // 60 minutes
const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled'; // From AyarlarPage

const SEVERE_WEATHER_THRESHOLDS = {
  HEAVY_RAIN_MM: 15,
  STRONG_WIND_KMH: 50,
  STRONG_GUST_KMH: 75,
  HEAVY_SNOW_CM: 5,
  STORM_CODES: [95, 96, 99],
  HAIL_CODES: [96, 99],
  FOG_CODES: [45, 48],
  FREEZING_RAIN_CODES: [56, 57, 66, 67],
};

interface WeatherAlert {
  locationName: string;
  condition: string; // Primary alert type for de-duplication
  title: string;
  details: string;
  type: StoredNotification['type'];
  link: string;
}

// Stores the primary alert type (e.g., "şiddetli_yağmur_uyarısı") and timestamp
interface LastNotifiedAlert {
  alertKey: string | null; // Unique key representing the alert condition
  timestamp: number | null;
}

export function useWeatherNotificationManager() {
  const { favorites } = useFavorites();
  const { addNotification } = useStoredNotifications();
  const [isManagerActive, setIsManagerActive] = useState(false);
  const [lastNotifiedAlerts, setLastNotifiedAlerts] = useState<Record<string, LastNotifiedAlert>>({});

  const generateAlertKey = (locationName: string, condition: string): string => {
    return `${locationName}::${condition.toLowerCase().replace(/\s+/g, '_')}`;
  };

  const checkAndNotifyForFavorites = useCallback(async () => {
    if (!isManagerActive || favorites.length === 0) {
      console.log("WeatherNotificationManager: Skipping check. Manager not active or no favorites.");
      return;
    }

    console.log('WeatherNotificationManager: Checking weather for notifications for favorites:', favorites);
    const newLastNotifiedAlerts = { ...lastNotifiedAlerts };
    let notificationsToSend: WeatherAlert[] = [];

    for (const fav of favorites) {
      try {
        const weather = await getWeatherData(fav.lat, fav.lon);
        if (!weather || !weather.daily || !weather.current) continue;

        const locationName = `${fav.province} / ${fav.district}`;
        const link = `/konum/${encodeURIComponent(fav.province)}/${encodeURIComponent(fav.district)}`;
        const dailyToday = weather.daily;
        const currentToday = weather.current;
        const todayIndex = 0; // Assuming index 0 is for today

        const currentCodeInfo = getWeatherInfo(currentToday.weather_code, currentToday.is_day === 1);
        const dailyWeatherCodeInfo = getWeatherInfo(dailyToday.weather_code?.[todayIndex] ?? 0, true);
        
        const potentialAlerts: Omit<WeatherAlert, 'title'>[] = [];

        // Severe Weather Alerts
        if (SEVERE_WEATHER_THRESHOLDS.STORM_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "fırtına_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.HAIL_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "dolu_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.FREEZING_RAIN_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "donan_yağmur_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        }

        if ((dailyToday.precipitation_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM) {
          potentialAlerts.push({ locationName, condition: "şiddetli_yağmur_uyarısı", details: `Günlük Toplam Beklenen: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm`, type: 'alert', link });
        }
        if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
          potentialAlerts.push({ locationName, condition: "yoğun_kar_uyarısı", details: `Günlük Toplam Beklenen: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm`, type: 'alert', link });
        }
        if ((dailyToday.wind_speed_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_WIND_KMH) {
          potentialAlerts.push({ locationName, condition: "şiddetli_rüzgar_uyarısı", details: `Günlük Max Hız Beklenen: ${dailyToday.wind_speed_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link });
        }
        if ((dailyToday.wind_gusts_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_GUST_KMH) {
          potentialAlerts.push({ locationName, condition: "çok_şiddetli_rüzgar_hamlesi_uyarısı", details: `Günlük Max Hamle Beklenen: ${dailyToday.wind_gusts_10m_max?.[todayIndex]?.toFixed(1)}km/s`, type: 'alert', link });
        }
        
        // Informational Notifications (only if no severe alert for the same category)
        if (!potentialAlerts.some(pa => pa.condition.includes("yağmur"))) {
          if ((dailyToday.precipitation_probability_max?.[todayIndex] ?? 0) >= 50 && (dailyToday.precipitation_sum?.[todayIndex] ?? 0) > 0) {
            potentialAlerts.push({ locationName, condition: "yağmur_beklentisi", details: `Olasılık: %${dailyToday.precipitation_probability_max?.[todayIndex]}, Beklenen Miktar: ${dailyToday.precipitation_sum?.[todayIndex]?.toFixed(1)}mm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
          }
        }
        if (!potentialAlerts.some(pa => pa.condition.includes("kar"))) {
           if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) > 0 && (dailyToday.snowfall_sum?.[todayIndex] ?? 0) < SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
            potentialAlerts.push({ locationName, condition: "kar_yağışı_beklentisi", details: `Beklenen Miktar: ${dailyToday.snowfall_sum?.[todayIndex]?.toFixed(1)}cm. ${dailyWeatherCodeInfo.description}`, type: 'info', link });
          }
        }
        if (SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(currentToday.weather_code) || SEVERE_WEATHER_THRESHOLDS.FOG_CODES.includes(dailyToday.weather_code?.[todayIndex] ?? -1)) {
           if (!potentialAlerts.some(pa => pa.condition.includes("sis"))) {
             potentialAlerts.push({ locationName, condition: "sis_beklentisi", details: `Anlık: ${currentCodeInfo.description}, Günlük: ${dailyWeatherCodeInfo.description}`, type: 'info', link });
           }
        }

        for (const alert of potentialAlerts) {
          const alertKey = generateAlertKey(alert.locationName, alert.condition);
          const lastNotified = newLastNotifiedAlerts[alertKey];

          if (!lastNotified || lastNotified.alertKey !== alert.condition) {
             const title = `${alert.type === 'alert' ? '⚠️ Uyarı' : 'ℹ️ Bilgi'}: ${alert.locationName} - ${alert.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
             notificationsToSend.push({ ...alert, title });
             newLastNotifiedAlerts[alertKey] = { alertKey: alert.condition, timestamp: Date.now() };
             console.log(`WeatherNotificationManager: Preparing notification for ${alert.locationName}: ${alert.condition}`);
          } else {
            console.log(`WeatherNotificationManager: Alert condition for ${alertKey} is the same as last notified. Skipping.`);
          }
        }

      } catch (error) {
        console.error(`WeatherNotificationManager: Error fetching weather data for ${fav.district}:`, error);
      }
    }

    if (notificationsToSend.length > 0) {
        notificationsToSend.forEach(alert => {
            // Add to in-app notification list
            addNotification({
                type: alert.type,
                title: alert.title,
                body: alert.details,
                locationName: alert.locationName,
                link: alert.link,
            });
            console.log(`WeatherNotificationManager: Added in-app notification for ${alert.locationName}: ${alert.condition}`);

            // Attempt to send system notification via Service Worker
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(alert.title, {
                        body: alert.details,
                        icon: '/logo.png', // Make sure this icon exists in /public
                        badge: '/logo_badge.png', // Optional: Make sure this icon exists in /public
                        data: { url: alert.link || '/' }
                    }).catch(err => {
                        console.error('WeatherNotificationManager: Error showing system notification:', err);
                    });
                }).catch(err => {
                    console.error('WeatherNotificationManager: Service Worker not ready for system notification:', err);
                });
            }
        });
    }
    setLastNotifiedAlerts(newLastNotifiedAlerts);

  }, [favorites, addNotification, isManagerActive, lastNotifiedAlerts]);

  // Effect to check notification settings and permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
      const permission = Notification.permission;
      setIsManagerActive(enabled && permission === 'granted');
      console.log(`WeatherNotificationManager: Initialized. Notifications Enabled: ${enabled}, Permission: ${permission}, Manager Active: ${isManagerActive}`);
      if (enabled && permission === 'granted') {
        checkAndNotifyForFavorites(); // Initial check on load if active
      }
    }
  }, [checkAndNotifyForFavorites, isManagerActive]); // Added isManagerActive dependency

  // Effect for polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive) {
      intervalId = setInterval(checkAndNotifyForFavorites, POLLING_INTERVAL);
      console.log('WeatherNotificationManager: Polling started.');
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      console.log('WeatherNotificationManager: Polling stopped.');
    };
  }, [isManagerActive, checkAndNotifyForFavorites]);

  // Effect for window focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("WeatherNotificationManager: Window focused, checking notifications.");
      if (isManagerActive) {
        checkAndNotifyForFavorites();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      // Also, listen for changes to the notification enabled setting from localStorage (e.g., if changed in another tab)
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === NOTIFICATION_ENABLED_KEY) {
          const enabled = event.newValue === 'true';
          const permission = Notification.permission;
          setIsManagerActive(enabled && permission === 'granted');
           console.log(`WeatherNotificationManager: Storage changed. Manager Active: ${enabled && permission === 'granted'}`);
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isManagerActive, checkAndNotifyForFavorites]);


  // This component doesn't render anything itself
  return null;
}

// This component can be placed in your RootLayout to initialize the manager
export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null;
}
