'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { FavoriteLocation, WeatherData } from '@/types/weather';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { useFavorites } from '@/hooks/useFavorites';
import { MapPin, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWeatherData } from '@/lib/weatherApi';

interface FavoriteLocationCardProps {
  location: FavoriteLocation;
}

export function FavoriteLocationCard({ location }: FavoriteLocationCardProps) {
  const { removeFavorite } = useFavorites();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      // Try to get from localStorage first
      const cachedDataString = localStorage.getItem(`weather-${location.lat}-${location.lon}`);
      if (cachedDataString) {
        const cachedData = JSON.parse(cachedDataString);
        // check if cache is recent (e.g. 1 hour)
        if (new Date().getTime() - new Date(cachedData.timestamp).getTime() < 3600 * 1000) {
            setWeather(cachedData.data);
            setLoading(false);
            return;
        }
      }

      const data = await getWeatherData(location.lat, location.lon);
      if (data) {
        setWeather(data);
        localStorage.setItem(`weather-${location.lat}-${location.lon}`, JSON.stringify({data: data, timestamp: new Date().toISOString()}));
      } else {
        setError(true);
      }
      setLoading(false);
    };
    fetchWeather();
  }, [location]);

  return (
    <Card className="flex flex-col justify-between shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-xl">{location.district}, {location.province}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {loading && (
          <div className="flex flex-col items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Yükleniyor...</p>
          </div>
        )}
        {error && !loading && (
           <div className="flex flex-col items-center justify-center h-24 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-1" />
            <p className="text-sm">Veri alınamadı</p>
          </div>
        )}
        {weather && !loading && !error && (
          <div className="flex items-center gap-4">
            <WeatherIconDisplay code={weather.current.weather_code} isDay={weather.current.is_day === 1} iconClassName="w-16 h-16" showDescription={true} descriptionClassName="text-xs mt-1" />
            <div className="text-3xl font-bold">
              {Math.round(weather.current.temperature_2m)}°C
            </div>
          </div>
        )}
         {!weather && !loading && !error && ( // Fallback if no weather but not loading/error (e.g. no cache)
           <p className="text-sm text-muted-foreground">Hava durumu bilgisi yüklenemedi.</p>
         )}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 p-4 bg-muted/20">
        <Button asChild variant="default" className="w-full">
          <Link href={`/konum/${encodeURIComponent(location.province)}/${encodeURIComponent(location.district)}`}>
            <MapPin className="mr-2 h-4 w-4" /> Detaylar
          </Link>
        </Button>
        <Button variant="destructive" onClick={() => removeFavorite(location.province, location.district)} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" /> Çıkar
        </Button>
      </CardFooter>
    </Card>
  );
}
