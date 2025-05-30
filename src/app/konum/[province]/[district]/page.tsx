
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWeatherData } from '@/lib/weatherApi';
import { findDistrict } from '@/lib/locationData';
import type { WeatherData, FavoriteLocation, HourlyWeather } from '@/types/weather';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { HourlyForecastChart } from '@/components/weather/HourlyForecastChart'; // Main content hourly chart
import { DailyForecastItem } from '@/components/weather/DailyForecastItem';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert'; // Added Alert
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Loader2, Thermometer, Wind, Droplets, Zap, Waves, Sun, Leaf, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import new chart components
import { TemperatureChart } from '@/components/weather/charts/TemperatureChart';
import { PrecipitationChart } from '@/components/weather/charts/PrecipitationChart';
import { WindChart } from '@/components/weather/charts/WindChart';
import { HumidityChart } from '@/components/weather/charts/HumidityChart';
import { UvIndexChart } from '@/components/weather/charts/UvIndexChart';
import { CloudCoverChart } from '@/components/weather/charts/CloudCoverChart';
import { PressureChart } from '@/components/weather/charts/PressureChart';


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

      let usedCache = false;
      try {
        setLoading(true); 
        const cachedDataString = localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`);
        if (cachedDataString) {
           const parsedCache = JSON.parse(cachedDataString);
           if (new Date().getTime() - new Date(parsedCache.timestamp).getTime() < 3600 * 1000) { 
              setWeatherData(parsedCache.data);
              // setLoading(false); // Don't set loading false yet if we're going to try to update
              usedCache = true; 
           }
        }
        
        if (!usedCache || (usedCache && new Date().getTime() - new Date(JSON.parse(cachedDataString!).timestamp).getTime() >= 3600 * 1000) ) {
            const data = await getWeatherData(districtData.lat, districtData.lon);
            if (data) {
              setWeatherData(data);
              localStorage.setItem(`weather-${districtData.lat}-${districtData.lon}`, JSON.stringify({data: data, timestamp: new Date().toISOString()}));
              setError(null); // Clear previous errors if fetch is successful
            } else {
              // If fetch fails, set an error message.
              // We keep displaying cached data if available.
              setError("Yeni hava durumu verileri alınamadı. Lütfen daha sonra tekrar deneyin. (API limitine ulaşılmış olabilir)");
            }
        }

      } catch (e) {
        console.error(e);
        // if (!weatherData) { // Only set fatal error if no data at all
            setError("Hava durumu verileri yüklenirken bir hata oluştu.");
        // }
      } finally {
        // if (!usedCache || (weatherData && new Date().getTime() - new Date(JSON.parse(localStorage.getItem(`weather-${districtData.lat}-${districtData.lon}`)!).timestamp).getTime() >= 3600 * 1000 ) ) {
             setLoading(false); // Set loading false after attempting fetch/update
        // }
      }
    }

    fetchData();
  }, [province, district]); 
  
  if (loading && !weatherData) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{locationName || "Konum"} için hava durumu yükleniyor...</p>
      </div>
    );
  }

  if (error && !weatherData) { // Fatal error if no data could be loaded at all
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
        <p>Hava durumu verisi bulunamadı veya yüklenemedi.</p>
        <Button asChild className="mt-4">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }
  
  const getHourlyDataForDay = (targetDateStr: string): HourlyWeather | null => {
    if (!weatherData?.hourly?.time || !weatherData.hourly.time.length) return null;
    
    const targetDate = parseISO(targetDateStr);
    const indices: number[] = [];
    weatherData.hourly.time.forEach((timeStr, index) => {
        if (isSameDay(parseISO(timeStr), targetDate)) {
            indices.push(index);
        }
    });

    if (indices.length === 0) return null;

    const hourlyDataForDay: Partial<HourlyWeather> = {};
    for (const key in weatherData.hourly) {
        if (Array.isArray((weatherData.hourly as any)[key])) {
            (hourlyDataForDay as any)[key] = indices.map(i => (weatherData.hourly as any)[key]?.[i]);
        } else {
            (hourlyDataForDay as any)[key] = (weatherData.hourly as any)[key];
        }
    }
    const requiredHourlyKeys: (keyof HourlyWeather)[] = ['time', 'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability', 'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'surface_pressure', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index', 'soil_temperature_0cm', 'soil_moisture_0_1cm', 'pressure_msl', 'is_day'];
    requiredHourlyKeys.forEach(key => {
        if (!(hourlyDataForDay as any)[key]) {
            (hourlyDataForDay as any)[key] = indices.map(() => undefined); 
        }
    });
    
    return hourlyDataForDay as HourlyWeather;
  };


  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri
      </Button>

      {error && weatherData && ( // Display non-fatal error if we have cached data but update failed
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading && weatherData && ( // Show a subtle loading indicator if updating in background
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Hava durumu güncelleniyor...
        </div>
      )}

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="main">Ana İçerik</TabsTrigger>
          <TabsTrigger value="graphics"><BarChart3 className="mr-2 h-4 w-4" />Grafiksel Bilgiler</TabsTrigger>
        </TabsList>
        <TabsContent value="main" className="mt-6 space-y-6">
          <CurrentWeatherCard
            currentWeather={weatherData.current}
            dailyWeather={{ 
              sunrise: weatherData.daily?.sunrise?.[0],
              sunset: weatherData.daily?.sunset?.[0],
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
                      weather_code: weatherData.daily.weather_code?.[index] ?? 0,
                      temperature_2m_max: weatherData.daily.temperature_2m_max?.[index] ?? 0,
                      temperature_2m_min: weatherData.daily.temperature_2m_min?.[index] ?? 0,
                      apparent_temperature_max: weatherData.daily.apparent_temperature_max?.[index] ?? 0,
                      apparent_temperature_min: weatherData.daily.apparent_temperature_min?.[index] ?? 0,
                      sunrise: weatherData.daily.sunrise?.[index] ?? new Date().toISOString(),
                      sunset: weatherData.daily.sunset?.[index] ?? new Date().toISOString(),
                      precipitation_sum: weatherData.daily.precipitation_sum?.[index] ?? 0,
                      rain_sum: weatherData.daily.rain_sum?.[index] ?? 0,
                      showers_sum: weatherData.daily.showers_sum?.[index] ?? 0,
                      snowfall_sum: weatherData.daily.snowfall_sum?.[index] ?? 0,
                      precipitation_hours: weatherData.daily.precipitation_hours?.[index] ?? 0,
                      precipitation_probability_max: weatherData.daily.precipitation_probability_max?.[index] ?? 0,
                      wind_speed_10m_max: weatherData.daily.wind_speed_10m_max?.[index] ?? 0,
                      wind_gusts_10m_max: weatherData.daily.wind_gusts_10m_max?.[index] ?? 0,
                      wind_direction_10m_dominant: weatherData.daily.wind_direction_10m_dominant?.[index] ?? 0,
                      uv_index_max: weatherData.daily.uv_index_max?.[index],
                      uv_index_clear_sky_max: weatherData.daily.uv_index_clear_sky_max?.[index],
                      shortwave_radiation_sum: weatherData.daily.shortwave_radiation_sum?.[index] ?? 0,
                      et0_fao_evapotranspiration: weatherData.daily.et0_fao_evapotranspiration?.[index] ?? 0,
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
                <h4 className="font-semibold text-sm flex items-center"><Waves className="w-4 h-4 mr-2 text-primary" />Toprak Nemi (0-1cm)</h4>
                <p className="text-xs">{weatherData.hourly?.soil_moisture_0_1cm?.[0]?.toFixed(2) ?? 'N/A'} m³/m³ (İlk saat)</p>
              </div>
               <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Leaf className="w-4 h-4 mr-2 text-primary" />Evapotranspirasyon (Günlük)</h4>
                <p className="text-xs">{weatherData.daily?.et0_fao_evapotranspiration?.[0]?.toFixed(2) ?? 'N/A'} mm</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Wind className="w-4 h-4 mr-2 text-primary" />Dominant Rüzgar Yönü (Günlük)</h4>
                <p className="text-xs">{weatherData.daily?.wind_direction_10m_dominant?.[0] ?? 'N/A'}°</p>
              </div>
               <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Sun className="w-4 h-4 mr-2 text-primary" />Kısa Dalga Radyasyon (Günlük)</h4>
                <p className="text-xs">{weatherData.daily?.shortwave_radiation_sum?.[0]?.toFixed(1) ?? 'N/A'} MJ/m²</p>
              </div>
               <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center"><Zap className="w-4 h-4 mr-2 text-primary" />Max UV İndeksi (Açık Hava)</h4>
                <p className="text-xs">{weatherData.daily?.uv_index_clear_sky_max?.[0]?.toFixed(1) ?? 'N/A'}</p>
              </div>
              <p className="text-xs text-muted-foreground md:col-span-2">Not: Bazı veriler anlık veya ilk saatlik/günlük değerleri temsil etmektedir.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graphics" className="mt-6 space-y-6">
          <TemperatureChart hourlyWeather={weatherData.hourly} />
          <PrecipitationChart hourlyWeather={weatherData.hourly} />
          <WindChart hourlyWeather={weatherData.hourly} />
          <HumidityChart hourlyWeather={weatherData.hourly} />
          <UvIndexChart hourlyWeather={weatherData.hourly} />
          <CloudCoverChart hourlyWeather={weatherData.hourly} />
          <PressureChart hourlyWeather={weatherData.hourly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
