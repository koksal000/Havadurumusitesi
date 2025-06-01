
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { StoredNotification } from '@/types/notifications';
import { useStoredNotifications } from './useStoredNotifications';
import { getWeatherInfo } from '@/lib/weatherIcons';

const POLLING_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';

const SEVERE_WEATHER_THRESHOLDS = {
  HEAVY_RAIN_MM: 15,
  STRONG_WIND_KMH: 50,
  STRONG_GUST_KMH: 75,
  HEAVY_SNOW_CM: 5,
  STORM_CODES: [95, 96, 97, 99], // Added 97 for heavy TS
  HAIL_CODES: [96, 99], // WMO codes from met.no mapping could differ
  FOG_CODES: [45, 48],
  FREEZING_RAIN_CODES: [56, 57, 66, 67],
};

interface WeatherAlert {
  locationName: string;
  condition: string;
  title: string;
  details: string;
  type: StoredNotification['type'];
  link: string;
}

interface LastNotifiedAlert {
  alertKey: string | null; // Unique key representing the alert condition (e.g., "Ankara / Çankaya::şiddetli_yağmur_uyarısı")
  conditionDetailsSignature: string | null; // A signature of the specific details (e.g., "15mm")
  timestamp: number | null;
}

export function useWeatherNotificationManager() {
  const { favorites } = useFavorites();
  const { addNotification } = useStoredNotifications();
  const [isManagerActive, setIsManagerActive] = useState(false);
  const [lastNotifiedAlerts, setLastNotifiedAlerts] = useLocalStorage<Record<string, LastNotifiedAlert>>('havadurumux-last-notified-alerts', {});

  const generateAlertKey = (locationName: string, condition: string): string => {
    return `${locationName}::${condition.toLowerCase().replace(/\s+/g, '_')}`;
  };

  const generateConditionDetailsSignature = (details: string): string => {
    // Creates a simple signature from details to detect changes.
    // For example, changes in rain amount or wind speed.
    return details.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const checkAndNotifyForFavorites = useCallback(async () => {
    if (!isManagerActive || favorites.length === 0) {
      console.log("WeatherNotificationManager: Skipping check. Manager not active or no favorites.");
      return;
    }

    console.log('WeatherNotificationManager: Checking weather for notifications for favorites:', favorites);
    const newLastNotifiedAlertsBatch = { ...lastNotifiedAlerts };
    let notificationsToSend: WeatherAlert[] = [];

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
        
        const potentialAlerts: Omit<WeatherAlert, 'title'>[] = [];

        // Severe Weather Alerts from Current Data
        if (SEVERE_WEATHER_THRESHOLDS.STORM_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "fırtına_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.HAIL_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "dolu_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        } else if (SEVERE_WEATHER_THRESHOLDS.FREEZING_RAIN_CODES.includes(currentToday.weather_code)) {
          potentialAlerts.push({ locationName, condition: "donan_yağmur_uyarısı", details: `Anlık: ${currentCodeInfo.description}`, type: 'alert', link });
        }
        
        // Severe Weather Alerts from Daily Forecast
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
        
        // Informational Notifications
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
          const currentConditionSignature = generateConditionDetailsSignature(alert.details);
          const lastNotified = newLastNotifiedAlertsBatch[alertKey];

          if (!lastNotified || lastNotified.alertKey !== alert.condition || lastNotified.conditionDetailsSignature !== currentConditionSignature) {
             const title = `${alert.type === 'alert' ? '⚠️ Uyarı' : 'ℹ️ Bilgi'}: ${alert.locationName} - ${alert.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
             notificationsToSend.push({ ...alert, title });
             newLastNotifiedAlertsBatch[alertKey] = { 
                alertKey: alert.condition, 
                conditionDetailsSignature: currentConditionSignature,
                timestamp: Date.now() 
             };
             console.log(`WeatherNotificationManager: Preparing notification for ${alert.locationName}: ${alert.condition} (Details: ${alert.details})`);
          } else {
            console.log(`WeatherNotificationManager: Alert for ${alertKey} is same as last notified or details haven't changed significantly. Skipping.`);
          }
        }

      } catch (error) {
        console.error(`WeatherNotificationManager: Error fetching/processing weather data for ${fav.district}:`, error);
      }
    }

    if (notificationsToSend.length > 0) {
        notificationsToSend.forEach(alert => {
            addNotification({
                type: alert.type,
                title: alert.title,
                body: alert.details,
                locationName: alert.locationName,
                link: alert.link,
            });
            console.log(`WeatherNotificationManager: Added in-app notification for ${alert.locationName}: ${alert.condition}`);

            // System notification logic (relies on sw.js and AyarlarPage setup)
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(alert.title, {
                        body: alert.details,
                        icon: '/logo.png',
                        badge: '/logo_badge.png', 
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
    setLastNotifiedAlerts(newLastNotifiedAlertsBatch);

  }, [favorites, addNotification, isManagerActive, lastNotifiedAlerts, setLastNotifiedAlerts]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
      const permission = Notification.permission; // Ensure this is checked
      const managerShouldBeActive = enabled && permission === 'granted';
      
      if (isManagerActive !== managerShouldBeActive) {
        setIsManagerActive(managerShouldBeActive);
      }
      console.log(`WeatherNotificationManager: Initialized. Notifications Enabled Setting: ${enabled}, Browser Permission: ${permission}, Manager Active: ${managerShouldBeActive}`);
      
      if (managerShouldBeActive) {
        checkAndNotifyForFavorites(); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to set initial state and check

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive) {
      intervalId = setInterval(checkAndNotifyForFavorites, POLLING_INTERVAL);
      console.log('WeatherNotificationManager: Polling started.');
    } else {
      console.log('WeatherNotificationManager: Polling not started (manager inactive).');
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      console.log('WeatherNotificationManager: Polling stopped.');
    };
  }, [isManagerActive, checkAndNotifyForFavorites]);

  useEffect(() => {
    const handleFocus = () => {
      console.log("WeatherNotificationManager: Window focused.");
      if (isManagerActive) {
        console.log("WeatherNotificationManager: Manager active, checking notifications on focus.");
        checkAndNotifyForFavorites();
      } else {
        console.log("WeatherNotificationManager: Manager inactive, not checking on focus.");
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_ENABLED_KEY) {
        const enabled = event.newValue === 'true';
        const permission = Notification.permission;
        setIsManagerActive(enabled && permission === 'granted');
        console.log(`WeatherNotificationManager: Storage changed. Manager Active: ${enabled && permission === 'granted'}`);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isManagerActive, checkAndNotifyForFavorites]);
  
  return null;
}

export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null;
}
