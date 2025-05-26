
import type { CurrentWeatherAPI } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { Thermometer, Wind, Droplets, Gauge, Eye, Sunrise, Sunset, Zap, CloudIcon, Umbrella } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CurrentWeatherCardProps {
  currentWeather: CurrentWeatherAPI;
  dailyWeather: { 
    sunrise: string; 
    sunset: string; 
    uv_index_max?: number; // From daily data
    precipitation_sum?: number; // From daily data
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
    uv_index,
    cloud_cover,
    precipitation,
  } = currentWeather;

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: tr });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  return (
    <Card className="shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{locationName}</CardTitle>
        <CardDescription>Anlık Hava Durumu ({format(new Date(currentWeather.time), 'HH:mm', { locale: tr })})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <WeatherIconDisplay code={weather_code} isDay={is_day === 1} iconClassName="w-24 h-24 text-primary" descriptionClassName="text-xl font-medium" />
          </div>
          <div className="text-6xl font-bold">
            {Math.round(temperature_2m)}°C
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 text-sm">
          <WeatherInfoItem Icon={Thermometer} label="Hissedilen" value={`${Math.round(apparent_temperature)}°C`} />
          <WeatherInfoItem Icon={Wind} label="Rüzgar" value={`${wind_speed_10m.toFixed(1)} km/s (${getWindDirection(wind_direction_10m)})`} />
          <WeatherInfoItem Icon={Wind} label="Rüzgar Hamlesi" value={`${wind_gusts_10m.toFixed(1)} km/s`} />
          <WeatherInfoItem Icon={Droplets} label="Nem" value={`%${relative_humidity_2m.toFixed(0)}`} />
          <WeatherInfoItem Icon={Gauge} label="Basınç" value={`${surface_pressure.toFixed(0)} hPa`} />
          <WeatherInfoItem Icon={Eye} label="Görüş Mesafesi" value={`${(visibility ? visibility / 1000 : 0).toFixed(1)} km`} />
          <WeatherInfoItem Icon={Zap} label="UV İndeksi (Anlık)" value={`${uv_index?.toFixed(1) ?? 'N/A'}`} />
          <WeatherInfoItem Icon={Zap} label="UV İndeksi (Günlük Max)" value={`${dailyWeather.uv_index_max?.toFixed(1) ?? 'N/A'}`} />
          <WeatherInfoItem Icon={CloudIcon} label="Bulut Örtüsü" value={`%${cloud_cover?.toFixed(0) ?? 'N/A'}`} />
          <WeatherInfoItem Icon={Umbrella} label="Yağış (Anlık)" value={`${precipitation?.toFixed(1) ?? '0'} mm`} />
          <WeatherInfoItem Icon={Umbrella} label="Yağış (Günlük Toplam)" value={`${dailyWeather.precipitation_sum?.toFixed(1) ?? '0'} mm`} />
          <WeatherInfoItem Icon={Sunrise} label="Gün Doğumu" value={dailyWeather.sunrise ? formatTime(dailyWeather.sunrise) : 'N/A'} />
          <WeatherInfoItem Icon={Sunset} label="Gün Batımı" value={dailyWeather.sunset ? formatTime(dailyWeather.sunset) : 'N/A'} />
        </div>
      </CardContent>
    </Card>
  );
}

interface WeatherInfoItemProps {
  Icon: React.ElementType;
  label: string;
  value: string;
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
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
