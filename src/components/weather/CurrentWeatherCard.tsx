import type { CurrentWeatherAPI } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { Thermometer, Wind, Droplets, Gauge, Eye, Sunrise, Sunset, Zap as UVIndexIcon } from 'lucide-react'; // Using Zap for UV as placeholder
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CurrentWeatherCardProps {
  currentWeather: CurrentWeatherAPI;
  dailyWeather: { sunrise: string; sunset: string; }; // For sunrise/sunset
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
    weather_code,
    is_day,
    visibility, // in meters from API, convert to km
    uv_index,
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
        <CardDescription>Anlık Hava Durumu</CardDescription>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 text-sm">
          <WeatherInfoItem Icon={Thermometer} label="Hissedilen" value={`${Math.round(apparent_temperature)}°C`} />
          <WeatherInfoItem Icon={Wind} label="Rüzgar" value={`${wind_speed_10m.toFixed(1)} km/s - ${getWindDirection(wind_direction_10m)}`} />
          <WeatherInfoItem Icon={Droplets} label="Nem" value={`%${relative_humidity_2m.toFixed(0)}`} />
          <WeatherInfoItem Icon={Gauge} label="Basınç" value={`${surface_pressure.toFixed(0)} hPa`} />
          <WeatherInfoItem Icon={Eye} label="Görüş Mesafesi" value={`${(visibility ? visibility / 1000 : 0).toFixed(1)} km`} />
          <WeatherInfoItem Icon={UVIndexIcon} label="UV İndeksi" value={`${uv_index?.toFixed(1) || 'N/A'}`} />
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
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg shadow-sm">
      <Icon className="w-5 h-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const directions = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
