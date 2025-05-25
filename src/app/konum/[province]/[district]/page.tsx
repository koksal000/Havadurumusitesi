'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWeatherData } from '@/lib/weatherApi';
import { findDistrict } from '@/lib/locationData';
import type { WeatherData, FavoriteLocation } from '@/types/weather';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { HourlyForecastChart } from '@/components/weather/HourlyForecastChart';
import { DailyForecastItem } from '@/components/weather/DailyForecastItem';
import { RadarMap } from '@/components/weather/RadarMap';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isSameDay } from 'date-fns';

export default function DistrictWeatherPage() {
  const params = useParams();
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [favoriteLocationData, setFavoriteLocationData] = useState<FavoriteLocation | null>(null);

  const province = typeof params.province === 'string' ? decodeURIComponent(params.province) : '';
  const district = typeof params.district === 'string' ? decodeURIComponent(params.district) : '';

  useEffect(() => {
    async function fetchData() {
      if (!province || !district) {
        setError("İl veya ilçe bilgisi eksik.");
        setLoading(false);
        return;
      }

      setLocationName(`${province} / ${district}`);
      const districtData = findDistrict(province, district);

      if (!districtData) {
        setError("Konum bulunamadı.");
        setLoading(false);
        return;
      }
      
      setFavoriteLocationData({ province, district, lat: districtData.lat, lon: districtData.lon });

      try {
        setLoading(true);
        const data = await getWeatherData(districtData.lat, districtData.lon);
        if (data) {
          setWeatherData(data);
          // Try to get cached data for offline if API fails or is slow initially
          const cachedData = localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`);
          if (cachedData) {
             const parsedCache = JSON.parse(cachedData);
             // Check if cache is recent enough (e.g., within last hour)
             if (new Date().getTime() - new Date(parsedCache.timestamp).getTime() < 3600 * 1000) {
                setWeatherData(parsedCache.data);
             }
          }
        } else {
          setError("Hava durumu verileri alınamadı.");
        }
      } catch (e) {
        console.error(e);
        setError("Hava durumu verileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [province, district]);
  
  // Save to localStorage on successful fetch
  useEffect(() => {
    if (weatherData && favoriteLocationData) {
      localStorage.setItem(`weather-${favoriteLocationData.lat}-${favoriteLocationData.lon}`, JSON.stringify({data: weatherData, timestamp: new Date().toISOString()}));
    }
  }, [weatherData, favoriteLocationData]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{locationName} için hava durumu yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive mb-2">{error}</p>
        <p className="text-muted-foreground mb-6">Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.</p>
        <Button asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="text-center py-10">
        <p>Hava durumu verisi bulunamadı.</p>
        <Button asChild className="mt-4">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }
  
  const getHourlyDataForDay = (targetDate: string): typeof weatherData.hourly | null => {
    if (!weatherData || !weatherData.hourly || !weatherData.hourly.time) return null;
    
    const indices: number[] = [];
    weatherData.hourly.time.forEach((timeStr, index) => {
        if (isSameDay(parseISO(timeStr), parseISO(targetDate))) {
            indices.push(index);
        }
    });

    if (indices.length === 0) return null;

    return {
        time: indices.map(i => weatherData.hourly.time[i]),
        temperature_2m: indices.map(i => weatherData.hourly.temperature_2m[i]),
        precipitation_probability: indices.map(i => weatherData.hourly.precipitation_probability[i]),
        weathercode: indices.map(i => weatherData.hourly.weathercode[i]),
        windspeed_10m: indices.map(i => weatherData.hourly.windspeed_10m[i]),
        relative_humidity_2m: indices.map(i => weatherData.hourly.relative_humidity_2m[i]),
        apparent_temperature: indices.map(i => weatherData.hourly.apparent_temperature[i]),
        surface_pressure: indices.map(i => weatherData.hourly.surface_pressure[i]),
        uv_index: indices.map(i => weatherData.hourly.uv_index[i]),
        visibility: indices.map(i => weatherData.hourly.visibility[i]),
    };
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri
      </Button>

      <CurrentWeatherCard
        currentWeather={weatherData.current}
        dailyWeather={{ sunrise: weatherData.daily.sunrise[0], sunset: weatherData.daily.sunset[0] }}
        locationName={locationName}
      />

      {favoriteLocationData && <FavoriteButton location={favoriteLocationData} />}

      <HourlyForecastChart hourlyWeather={weatherData.hourly} />

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>7 Günlük Tahmin</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {weatherData.daily.time.map((time, index) => (
              <DailyForecastItem
                key={time}
                dayData={{
                  time,
                  weathercode: weatherData.daily.weathercode[index],
                  temperature_2m_max: weatherData.daily.temperature_2m_max[index],
                  temperature_2m_min: weatherData.daily.temperature_2m_min[index],
                  sunrise: weatherData.daily.sunrise[index],
                  sunset: weatherData.daily.sunset[index],
                  precipitation_probability_max: weatherData.daily.precipitation_probability_max?.[index],
                  uv_index_max: weatherData.daily.uv_index_max?.[index]
                }}
                hourlyDataForDay={getHourlyDataForDay(time)}
                isToday={isSameDay(parseISO(time), new Date())}
              />
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Hava Durumu Göstergeleri</CardTitle>
          <CardDescription>Önemli meteorolojik bilgiler ve uyarılar.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Meteorolojik uyarılar (AFAD, MGM, Open-Meteo) burada gösterilecektir (Bu özellik yapım aşamasındadır).</p>
          {/* Example data points */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm">Yağış Türü</h4>
                <p className="text-xs">Mevcut yağış türü (kar, yağmur, dolu vb.) bilgisi.</p>
             </div>
             <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm">Zemin Sıcaklığı</h4>
                <p className="text-xs">Zemin sıcaklığı bilgisi.</p>
             </div>
          </div>
        </CardContent>
      </Card>


      <RadarMap lat={weatherData.latitude} lon={weatherData.longitude} />
    </div>
  );
}
