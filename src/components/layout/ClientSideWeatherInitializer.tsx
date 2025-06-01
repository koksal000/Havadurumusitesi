
'use client';

import dynamic from 'next/dynamic';

// Dynamically import WeatherNotificationInitializer only on the client-side
const WeatherNotificationInitializerComponent = dynamic(
  () => import('@/hooks/useWeatherNotificationManager').then(mod => mod.WeatherNotificationInitializer),
  { ssr: false }
);

export default function ClientSideWeatherInitializer() {
  return <WeatherNotificationInitializerComponent />;
}
