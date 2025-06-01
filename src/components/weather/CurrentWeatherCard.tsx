
import type { CurrentWeatherAPI } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { Thermometer, Wind, Droplets, Gauge, Eye, Sunrise, Sunset, Zap, CloudIcon, Umbrella } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CurrentWeatherCardProps {
  currentWeather: CurrentWeatherAPI;
  dailyWeather: {
    sunrise?: string;
    sunset?: string;
    uv_index_max?: number | null;
    precipitation_sum?: number;
  };
  locationName: string;
}

export function CurrentWeatherCard({ currentWeather, dailyWeather, locationName }: CurrentWeatherCardProps) {
  const {
    temperature_2m,
    apparent_temperature,
    relative_humidity_2m,
    surface_pressure,
    wind_speed_10m,
    wind_direction_10m,
    wind_gusts_10m,
    weather_code,
    is_day,
    visibility,
    uv_index, // Current UV index from API (can be null)
    cloud_cover,
    precipitation, // Current total precipitation
  } = currentWeather;

  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      // Check if dateString is already a Date object (less likely from API but good practice)
      // or if it's a valid ISO string.
      const dateObj = dateString instanceof Date ? dateString : parseISO(dateString);
      return format(dateObj, 'HH:mm', { locale: tr });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  const displayApparentTemp = apparent_temperature !== null && apparent_temperature !== undefined
    ? `${Math.round(apparent_temperature)}°C`
    : "N/A";

  const displayUvIndex = uv_index !== null && uv_index !== undefined
    ? uv_index.toFixed(1)
    : "N/A";

  const displayDailyUvIndexMax = dailyWeather.uv_index_max !== null && dailyWeather.uv_index_max !== undefined
    ? dailyWeather.uv_index_max.toFixed(1)
    : "N/A";

  const displayWindGusts = wind_gusts_10m !== null && wind_gusts_10m !== undefined
    ? `${wind_gusts_10m.toFixed(1)} km/s`
    : "N/A";

  const displayVisibility = visibility !== null && visibility !== undefined
    ? `${(visibility / 1000).toFixed(1)} km`
    : "N/A";


  return (
    <Card className="shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{locationName}</CardTitle>
        <CardDescription>Anlık Hava Durumu ({currentWeather.time ? format(parseISO(currentWeather.time), 'HH:mm, dd MMM', { locale: tr }) : 'N/A'})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <WeatherIconDisplay code={weather_code ?? 0} isDay={(is_day ?? 1) === 1} iconClassName="w-24 h-24 text-primary" descriptionClassName="text-xl font-medium" />
          </div>
          <div className="text-6xl font-bold">
            {Math.round(temperature_2m ?? 0)}°C
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 text-sm">
          <WeatherInfoItem Icon={Thermometer} label="Hissedilen" value={displayApparentTemp} />
          <WeatherInfoItem Icon={Wind} label="Rüzgar" value={`${(wind_speed_10m ?? 0).toFixed(1)} km/s (${getWindDirection(wind_direction_10m ?? 0)})`} />
          <WeatherInfoItem Icon={Wind} label="Rüzgar Hamlesi" value={displayWindGusts} />
          <WeatherInfoItem Icon={Droplets} label="Nem" value={`%${(relative_humidity_2m ?? 0).toFixed(0)}`} />
          <WeatherInfoItem Icon={Gauge} label="Basınç" value={`${(surface_pressure ?? 0).toFixed(0)} hPa`} />
          <WeatherInfoItem Icon={Eye} label="Görüş Mesafesi" value={displayVisibility} />
          <WeatherInfoItem Icon={Zap} label="UV İndeksi (Anlık)" value={displayUvIndex} />
          <WeatherInfoItem Icon={Zap} label="UV İndeksi (Günlük Max)" value={displayDailyUvIndexMax} />
          <WeatherInfoItem Icon={CloudIcon} label="Bulut Örtüsü" value={`%${(cloud_cover ?? 0).toFixed(0)}`} />
          <WeatherInfoItem Icon={Umbrella} label="Yağış (Anlık)" value={`${(precipitation ?? 0).toFixed(1)} mm`} />
          <WeatherInfoItem Icon={Umbrella} label="Yağış (Günlük Toplam)" value={`${(dailyWeather.precipitation_sum ?? 0).toFixed(1)} mm`} />
          <WeatherInfoItem Icon={Sunrise} label="Gün Doğumu" value={formatTime(dailyWeather.sunrise)} />
          <WeatherInfoItem Icon={Sunset} label="Gün Batımı" value={formatTime(dailyWeather.sunset)} />
        </div>
      </CardContent>
    </Card>
  );
}

interface WeatherInfoItemProps {
  Icon: React.ElementType;
  label: string;
  value: string | number;
}

function WeatherInfoItem({ Icon, label, value }: WeatherInfoItemProps) {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg shadow-sm min-h-[60px]">
      <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="font-medium text-sm leading-tight">{value}</p>
      </div>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const directions = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
  const index = Math.round((degrees ?? 0) / 22.5) % 16;
  return directions[index];
}
