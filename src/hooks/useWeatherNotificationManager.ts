
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { getWeatherData } from '@/lib/weatherApi';
import type { WeatherData, DailyWeather } from '@/types/weather';
import { useToast } from '@/components/ui/use-toast';
import { getWeatherInfo } from '@/lib/weatherIcons';

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
const NOTIFICATION_PERMISSION_KEY = 'havadurumux-notification-permission';
const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Define thresholds for severe weather
const SEVERE_WEATHER_THRESHOLDS = {
  HEAVY_RAIN_MM: 20, // mm in 24h for daily precipitation_sum
  STRONG_WIND_KMH: 60, // km/h for daily wind_speed_10m_max
  STRONG_GUST_KMH: 80, // km/h for daily wind_gusts_10m_max
  HEAVY_SNOW_CM: 10, // cm in 24h for daily snowfall_sum
  // Weather codes for immediate alerts
  STORM_CODES: [95, 96, 99], // Thunderstorm, Thunderstorm with slight/heavy hail
  HAIL_CODES: [96, 99],
  // Consider other specific weather codes if needed, e.g. freezing rain, heavy drizzle
};

interface SevereWeatherAlert {
  locationName: string;
  condition: string;
  details: string;
}

export function useWeatherNotificationManager() {
  const { favorites } = useFavorites();
  const { toast } = useToast();
  const [isManagerActive, setIsManagerActive] = useState(false);

  const checkAndNotify = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const notificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
    const permission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;

    if (!notificationsEnabled || permission !== 'granted' || favorites.length === 0) {
      return;
    }

    console.log('Checking weather for notifications for favorites:', favorites);

    const alerts: SevereWeatherAlert[] = [];

    for (const fav of favorites) {
      try {
        const weather = await getWeatherData(fav.lat, fav.lon);
        if (weather && weather.daily && weather.current) {
          const locationName = `${fav.province} / ${fav.district}`;
          const dailyToday = weather.daily;
          const currentToday = weather.current;

          // Check based on daily summaries (for today)
          if (dailyToday.time && dailyToday.time.length > 0) {
            const todayIndex = 0; // Assuming first entry is today

            if ((dailyToday.precipitation_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_RAIN_MM) {
              alerts.push({ locationName, condition: "Şiddetli Yağmur", details: `Beklenen Yağış: ${dailyToday.precipitation_sum?.[todayIndex]}mm` });
            }
            if ((dailyToday.snowfall_sum?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.HEAVY_SNOW_CM) {
              alerts.push({ locationName, condition: "Yoğun Kar Yağışı", details: `Beklenen Kar: ${dailyToday.snowfall_sum?.[todayIndex]}cm` });
            }
            if ((dailyToday.wind_speed_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_WIND_KMH) {
              alerts.push({ locationName, condition: "Şiddetli Rüzgar", details: `Max Rüzgar: ${dailyToday.wind_speed_10m_max?.[todayIndex]}km/s` });
            }
             if ((dailyToday.wind_gusts_10m_max?.[todayIndex] ?? 0) >= SEVERE_WEATHER_THRESHOLDS.STRONG_GUST_KMH) {
              alerts.push({ locationName, condition: "Çok Şiddetli Rüzgar Hamlesi", details: `Max Hamle: ${dailyToday.wind_gusts_10m_max?.[todayIndex]}km/s` });
            }
             // Check current weather_code for immediate severe events
            if (SEVERE_WEATHER_THRESHOLDS.STORM_CODES.includes(currentToday.weather_code)) {
                 alerts.push({ locationName, condition: "Fırtına Riski", details: `${getWeatherInfo(currentToday.weather_code, currentToday.is_day === 1).description}` });
            } else if (SEVERE_WEATHER_THRESHOLDS.HAIL_CODES.includes(currentToday.weather_code)) {
                 alerts.push({ locationName, condition: "Dolu Riski", details: `${getWeatherInfo(currentToday.weather_code, currentToday.is_day === 1).description}` });
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching weather data for ${fav.district}:`, error);
      }
    }

    alerts.forEach(alert => {
      new Notification(`Hava Durumu Uyarısı: ${alert.locationName}`, {
        body: `${alert.condition} bekleniyor. Detay: ${alert.details}`,
        icon: '/logo.png', // Replace with your app's logo path
      });
      toast({
        title: `Hava Durumu Uyarısı: ${alert.locationName}`,
        description: `${alert.condition} bekleniyor. ${alert.details}`,
        duration: 10000, // Show toast longer
      });
    });
  }, [favorites, toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkInitialStatus = () => {
        const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
        const permission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;
        setIsManagerActive(enabled && permission === 'granted');
    }
    
    checkInitialStatus(); // Check on mount

    // Listen for changes in localStorage from other tabs/windows or settings page
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_ENABLED_KEY || event.key === NOTIFICATION_PERMISSION_KEY) {
        checkInitialStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);


    let intervalId: NodeJS.Timeout | null = null;
    if (isManagerActive && favorites.length > 0) {
      checkAndNotify(); // Initial check
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

  // This hook doesn't render anything itself, it just manages the background process.
  return null; 
}

// Helper component to mount the hook
export function WeatherNotificationInitializer() {
  useWeatherNotificationManager();
  return null; // This component does not render anything
}
