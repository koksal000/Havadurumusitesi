
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWeatherData } from '@/lib/weatherApi';
import { findDistrict } from '@/lib/locationData';
import type { WeatherData, FavoriteLocation, HourlyWeather } from '@/types/weather';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { HourlyForecastChart } from '@/components/weather/HourlyForecastChart';
import { DailyForecastItem } from '@/components/weather/DailyForecastItem';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Loader2, Thermometer, Wind, Droplets, Zap } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        const cachedData = localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`);
        if (cachedData) {
           const parsedCache = JSON.parse(cachedData);
           if (new Date().getTime() - new Date(parsedCache.timestamp).getTime() < 3600 * 1000) { // 1 hour cache
              setWeatherData(parsedCache.data);
              setLoading(false); // Set loading false if using cache
              // No early return, still fetch fresh data in background, but UI updates with cache first
           }
        }
        
        const data = await getWeatherData(districtData.lat, districtData.lon);
        if (data) {
          setWeatherData(data);
        } else {
          if (!weatherData) { // Only set error if no cached data is already displayed
            setError("Hava durumu verileri alınamadı.");
          }
        }
      } catch (e) {
        console.error(e);
        if (!weatherData) { // Only set error if no cached data is already displayed
            setError("Hava durumu verileri yüklenirken bir hata oluştu.");
        }
      } finally {
        // Only set loading to false if we didn't already set it due to cache
        if (!localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`) || 
            (localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`) && 
             new Date().getTime() - new Date(JSON.parse(localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`)!).timestamp).getTime() >= 3600 * 1000)
           ) {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [province, district, weatherData]); // Added weatherData to dependencies to avoid issues if cache logic changes
  
  useEffect(() => {
    if (weatherData && favoriteLocationData) {
      localStorage.setItem(`weather-${favoriteLocationData.lat}-${favoriteLocationData.lon}`, JSON.stringify({data: weatherData, timestamp: new Date().toISOString()}));
    }
  }, [weatherData, favoriteLocationData]);


  if (loading && !weatherData) { // Show loading only if no weatherData (neither fresh nor cached)
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{locationName} için hava durumu yükleniyor...</p>
      </div>
    );
  }

  if (error && !weatherData) { // Show error only if no weatherData
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
    // This case should ideally be covered by loading or error states if fetchData doesn't populate weatherData
    return (
      <div className="text-center py-10">
        <p>Hava durumu verisi bulunamadı.</p>
        <Button asChild className="mt-4">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }
  
  const getHourlyDataForDay = (targetDate: string): HourlyWeather | null => {
    if (!weatherData?.hourly?.time) return null;
    
    const indices: number[] = [];
    weatherData.hourly.time.forEach((timeStr, index) => {
        if (isSameDay(parseISO(timeStr), parseISO(targetDate))) {
            indices.push(index);
        }
    });

    if (indices.length === 0) return null;

    const hourlyDataForDay: Partial<HourlyWeather> = {};
    for (const key in weatherData.hourly) {
        if (Array.isArray((weatherData.hourly as any)[key])) {
            (hourlyDataForDay as any)[key] = indices.map(i => (weatherData.hourly as any)[key][i]);
        }
    }
    return hourlyDataForDay as HourlyWeather;
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri
      </Button>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Ana İçerik</TabsTrigger>
          <TabsTrigger value="graphics">Grafiksel Bilgiler</TabsTrigger>
        </TabsList>
        <TabsContent value="main" className="mt-6 space-y-6">
          <CurrentWeatherCard
            currentWeather={weatherData.current}
            dailyWeather={{ 
              sunrise: weatherData.daily?.sunrise?.[0] as string, // Ensure string type or handle undefined in card
              sunset: weatherData.daily?.sunset?.[0] as string, // Ensure string type or handle undefined in card
              uv_index_max: weatherData.daily?.uv_index_max?.[0],
              precipitation_sum: weatherData.daily?.precipitation_sum?.[0]
            }}
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
                      weather_code: weatherData.daily.weather_code[index],
                      temperature_2m_max: weatherData.daily.temperature_2m_max[index],
                      temperature_2m_min: weatherData.daily.temperature_2m_min[index],
                      apparent_temperature_max: weatherData.daily.apparent_temperature_max[index],
                      apparent_temperature_min: weatherData.daily.apparent_temperature_min[index],
                      sunrise: weatherData.daily.sunrise[index],
                      sunset: weatherData.daily.sunset[index],
                      precipitation_sum: weatherData.daily.precipitation_sum[index],
                      rain_sum: weatherData.daily.rain_sum[index],
                      showers_sum: weatherData.daily.showers_sum[index],
                      snowfall_sum: weatherData.daily.snowfall_sum[index],
                      precipitation_hours: weatherData.daily.precipitation_hours[index],
                      precipitation_probability_max: weatherData.daily.precipitation_probability_max?.[index],
                      wind_speed_10m_max: weatherData.daily.wind_speed_10m_max[index],
                      wind_gusts_10m_max: weatherData.daily.wind_gusts_10m_max[index],
                      wind_direction_10m_dominant: weatherData.daily.wind_direction_10m_dominant[index],
                      uv_index_max: weatherData.daily.uv_index_max?.[index],
                      shortwave_radiation_sum: weatherData.daily.shortwave_radiation_sum[index],
                      et0_fao_evapotranspiration: weatherData.daily.et0_fao_evapotranspiration[index],
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
              <CardTitle>Hava Durumu Ek Bilgileri</CardTitle>
              <CardDescription>Diğer önemli meteorolojik veriler.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Thermometer className="w-4 h-4 mr-2 text-primary" />Toprak Sıcaklığı (0cm)</h4>
                <p className="text-xs">{weatherData.hourly?.soil_temperature_0cm?.[0]?.toFixed(1) ?? 'N/A'} °C (İlk saat)</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Droplets className="w-4 h-4 mr-2 text-primary" />Toprak Nemi (0-1cm)</h4>
                <p className="text-xs">{weatherData.hourly?.soil_moisture_0_1cm?.[0]?.toFixed(2) ?? 'N/A'} m³/m³ (İlk saat)</p>
              </div>
               <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Zap className="w-4 h-4 mr-2 text-primary" />Evapotranspirasyon (Günlük)</h4>
                <p className="text-xs">{weatherData.daily?.et0_fao_evapotranspiration?.[0]?.toFixed(2) ?? 'N/A'} mm</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Wind className="w-4 h-4 mr-2 text-primary" />Dominant Rüzgar Yönü (Günlük)</h4>
                <p className="text-xs">{weatherData.daily?.wind_direction_10m_dominant?.[0] ?? 'N/A'}°</p>
              </div>
              <p className="text-xs text-muted-foreground md:col-span-2">Not: Bazı veriler anlık veya ilk saatlik/günlük değerleri temsil etmektedir.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graphics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Grafiksel Bilgiler</CardTitle>
              <CardDescription>Hava durumu verilerinin grafiksel gösterimi burada yer alacak.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Grafikler yakında eklenecektir.</p>
              {/* New chart components will be added here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

