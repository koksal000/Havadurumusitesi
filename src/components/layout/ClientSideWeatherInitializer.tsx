
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import WeatherNotificationInitializer only on the client-side
const WeatherNotificationInitializerComponent = dynamic(
  () => import('@/hooks/useWeatherNotificationManager').then(mod => mod.WeatherNotificationInitializer),
  { ssr: false }
);

export default function ClientSideWeatherInitializer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Don't render anything until mounted on the client
  }

  // Only render the component that uses client-side hooks after mounting
  return <WeatherNotificationInitializerComponent />;
}
