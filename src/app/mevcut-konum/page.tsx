
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProvinces, getDistricts, findDistrict } from '@/lib/locationData';
import type { District } from '@/types/location';
import { getWeatherData } from '@/lib/weatherApi';
import type { WeatherData, FavoriteLocation, HourlyWeather } from '@/types/weather';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert'; // Corrected import alias
import { Loader2, AlertTriangle, Compass, Settings, InfoIcon, ArrowLeft, BarChart3, Thermometer, Wind, Droplets, Zap, Waves, Sun, Leaf } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion } from '@/components/ui/accordion';

import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { HourlyForecastChart } from '@/components/weather/HourlyForecastChart';
import { DailyForecastItem } from '@/components/weather/DailyForecastItem';
import { FavoriteButton } from '@/components/FavoriteButton';

// Import chart components
import { TemperatureChart } from '@/components/weather/charts/TemperatureChart';
import { PrecipitationChart } from '@/components/weather/charts/PrecipitationChart';
import { WindChart } from '@/components/weather/charts/WindChart';
import { HumidityChart } from '@/components/weather/charts/HumidityChart';
import { UvIndexChart } from '@/components/weather/charts/UvIndexChart';
import { CloudCoverChart } from '@/components/weather/charts/CloudCoverChart';
import { PressureChart } from '@/components/weather/charts/PressureChart';

const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';
const LOCATION_PERMISSION_KEY = 'havadurumux-location-permission';
const POLLING_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Haversine distance function
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function MevcutKonumPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Mevcut konumunuz alınıyor...');
  const [currentProvince, setCurrentProvince] = useState<string | null>(null);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [favoriteLocationData, setFavoriteLocationData] = useState<FavoriteLocation | null>(null);


  const getHourlyDataForDay = useCallback((targetDateStr: string, hourlyApiData?: HourlyWeather): HourlyWeather | null => {
    if (!hourlyApiData?.time || !hourlyApiData.time.length) return null;
    
    const targetDate = parseISO(targetDateStr);
    const indices: number[] = [];
    hourlyApiData.time.forEach((timeStr, index) => {
        if (isSameDay(parseISO(timeStr), targetDate)) {
            indices.push(index);
        }
    });

    if (indices.length === 0) return null;

    const hourlyDataForDay: Partial<HourlyWeather> = {};
    for (const key in hourlyApiData) {
        if (Array.isArray((hourlyApiData as any)[key])) {
            (hourlyDataForDay as any)[key] = indices.map(i => (hourlyApiData as any)[key]?.[i]);
        } else {
            (hourlyDataForDay as any)[key] = (hourlyApiData as any)[key];
        }
    }
    const requiredHourlyKeys: (keyof HourlyWeather)[] = ['time', 'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability', 'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'surface_pressure', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index', 'soil_temperature_0cm', 'soil_moisture_0_1cm', 'pressure_msl', 'is_day'];
    requiredHourlyKeys.forEach(key => {
        if (!(hourlyDataForDay as any)[key]) {
            (hourlyDataForDay as any)[key] = indices.map(() => undefined); 
        }
    });
    
    return hourlyDataForDay as HourlyWeather;
  }, []);


  const fetchLocationAndWeather = useCallback(async () => {
    setLoading(true);
    // setError(null); // Don't clear general errors on each poll, only API update errors
    setStatusMessage('Konum ve hava durumu bilgileri güncelleniyor...');

    const locationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY) === 'true';
    let locationPermission = localStorage.getItem(LOCATION_PERMISSION_KEY) as PermissionState | null;

    if (!locationServicesEnabled) {
      setError("Konum servisleri ayarlardan etkinleştirilmemiş.");
      setStatusMessage("Lütfen ayarlardan konum servislerini etkinleştirin.");
      setLoading(false);
      return;
    }

    if (navigator.permissions && (!locationPermission || locationPermission === 'prompt')) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        locationPermission = permissionStatus.state;
        localStorage.setItem(LOCATION_PERMISSION_KEY, locationPermission);
    }

    if (locationPermission !== 'granted') {
      setError(locationPermission === 'denied' 
          ? "Konum izni reddedilmiş. Lütfen tarayıcı ayarlarından izin verin." 
          : "Konum izni gerekiyor. Lütfen tarayıcı istemine yanıt verin veya ayarlardan kontrol edin."
      );
      setStatusMessage(locationPermission === 'denied' ? "İzin reddedildi." : "İzin bekleniyor veya gerekli.");
      setLoading(false);
      if (locationPermission === 'denied') return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setStatusMessage('Konum alındı, en yakın ilçe bulunuyor...');

          const provincesData = getProvinces();
          let closestDistrictObj: District | null = null;
          let closestProvinceName: string | null = null;
          let minDistance = Infinity;

          provincesData.forEach(provinceName => {
            const districtsData = getDistricts(provinceName);
            districtsData.forEach(districtObj => {
              if (districtObj.lat !== 0 || districtObj.lon !== 0) { 
                const distance = getDistance(latitude, longitude, districtObj.lat, districtObj.lon);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestDistrictObj = districtObj;
                  closestProvinceName = provinceName;
                }
              }
            });
          });
          
          const MAX_ACCEPTABLE_DISTANCE_KM = 75; 

          if (closestDistrictObj && closestProvinceName && minDistance <= MAX_ACCEPTABLE_DISTANCE_KM) {
            setCurrentProvince(closestProvinceName);
            setCurrentDistrict(closestDistrictObj.name);
            setCurrentLat(closestDistrictObj.lat);
            setCurrentLon(closestDistrictObj.lon);
            setFavoriteLocationData({ province: closestProvinceName, district: closestDistrictObj.name, lat: closestDistrictObj.lat, lon: closestDistrictObj.lon });
            setStatusMessage(`${closestProvinceName} / ${closestDistrictObj.name} için hava durumu yükleniyor...`);
            
            try {
              const data = await getWeatherData(closestDistrictObj.lat, closestDistrictObj.lon);
              if (data) {
                setWeatherData(data);
                localStorage.setItem(`weather-${closestDistrictObj.lat}-${closestDistrictObj.lon}`, JSON.stringify({data: data, timestamp: new Date().toISOString()}));
                setError(null); // Clear previous errors on successful fetch
              } else {
                 setError("Mevcut konum için hava durumu verileri güncellenemedi. (API limitine ulaşılmış olabilir)");
              }
            } catch (e) {
              console.error(e);
              setError("Mevcut konum için hava durumu verileri yüklenirken bir hata oluştu.");
            }

          } else {
            setError(`En yakın bilinen ilçe bulunamadı (Mesafe: ${minDistance > MAX_ACCEPTABLE_DISTANCE_KM ? '>'+MAX_ACCEPTABLE_DISTANCE_KM : minDistance.toFixed(1)} km). Lütfen konum verilerinin doğruluğunu kontrol edin veya manuel arama yapın.`);
            setStatusMessage('En yakın ilçe bulunamadı.');
            setWeatherData(null); 
          }
          setLoading(false);
        },
        (geoError) => {
          let errorMessage = `Konum alınırken hata oluştu: ${geoError.message}`;
          if (geoError.code === geoError.PERMISSION_DENIED) {
              errorMessage = "Konum izni reddedildi. Bu özelliği kullanmak için tarayıcı ayarlarınızdan izin vermelisiniz.";
              localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
          }
          setError(errorMessage);
          setStatusMessage('Konum alınamadı.');
          setWeatherData(null);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      setError("Tarayıcınız konum servislerini desteklemiyor.");
      setStatusMessage('Desteklenmiyor.');
      setWeatherData(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationAndWeather(); 
    const intervalId = setInterval(fetchLocationAndWeather, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchLocationAndWeather]);


  if (loading && !weatherData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{statusMessage}</p>
      </div>
    );
  }

  if (error && !weatherData) { 
    return (
      <Card className="shadow-xl rounded-xl max-w-md mx-auto my-10">
        <CardHeader>
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-8 h-8" />
            <CardTitle className="text-2xl">Konum Hatası</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">{error || "Bir hata oluştu."}</p>
          {error && error.includes("ayarlardan") && (
             <Button asChild>
                <Link href="/ayarlar"><Settings className="mr-2 h-4 w-4" /> Ayarlara Git</Link>
             </Button>
          )}
           {!error?.includes("ayarlardan") && (currentProvince || currentDistrict) && (
             <Button onClick={fetchLocationAndWeather} variant="outline">
                <Compass className="mr-2 h-4 w-4" /> Tekrar Dene
             </Button>
           )}
          <Button asChild variant="secondary">
            <Link href="/kesfet"><Compass className="mr-2 h-4 w-4" /> Manuel Konum Ara</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!weatherData || !currentProvince || !currentDistrict) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
         {loading && <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />}
        <p className="text-xl text-muted-foreground mb-2">{error || statusMessage || "Mevcut konumunuz için hava durumu yükleniyor..."}</p>
        {error && error.includes("ayarlardan") && (
             <Button asChild>
                <Link href="/ayarlar"><Settings className="mr-2 h-4 w-4" /> Ayarlara Git</Link>
             </Button>
          )}
         <Button asChild variant="outline" className="mt-2">
            <Link href="/kesfet"><Compass className="mr-2 h-4 w-4" /> Manuel Konum Ara</Link>
          </Button>
      </div>
    );
  }

  const locationName = `${currentProvince} / ${currentDistrict}`;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Not: Konum bilgisi GPS ve en yakın bilinen ilçe merkezine göre tahmin edilmektedir. Sınır hassasiyeti değişiklik gösterebilir.
        Veriler her 30 dakikada bir güncellenir.
      </p>
      {error && weatherData && ( 
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <ShadcnAlertDescription> {/* Using renamed import */}
            {error}
          </ShadcnAlertDescription>
        </Alert>
      )}
      {loading && weatherData && (
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Mevcut konum hava durumu güncelleniyor...
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
                    hourlyDataForDay={getHourlyDataForDay(time, weatherData.hourly)}
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

    

    