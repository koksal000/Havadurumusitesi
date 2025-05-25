import type { DailyWeather, HourlyWeather } from '@/types/weather';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Sunrise, Sunset, Thermometer, Droplets, Wind, Zap as UVIndexIcon, Umbrella } from 'lucide-react';

interface DailyForecastItemProps {
  dayData: {
    time: string;
    weathercode: number;
    temperature_2m_max: number;
    temperature_2m_min: number;
    sunrise: string;
    sunset: string;
    precipitation_probability_max?: number;
    uv_index_max?: number;
  };
  hourlyDataForDay: { // Pass filtered hourly data for this specific day for more details
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    relative_humidity_2m: number[];
    windspeed_10m: number[];
  } | null;
  isToday?: boolean;
}

export function DailyForecastItem({ dayData, hourlyDataForDay, isToday = false }: DailyForecastItemProps) {
  const {
    time,
    weathercode,
    temperature_2m_max,
    temperature_2m_min,
    sunrise,
    sunset,
    precipitation_probability_max,
    uv_index_max
  } = dayData;

  const date = parseISO(time);
  const dayName = isToday ? "Bugün" : format(date, 'eeee', { locale: tr });
  const formattedDate = format(date, 'dd MMM', { locale: tr });

  const DetailItem = ({ Icon, label, value }: { Icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-2 text-sm p-1.5 bg-background rounded">
      <Icon className="w-4 h-4 text-primary" />
      <span>{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <AccordionItem value={time} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="hover:bg-accent/50 px-4 py-3 rounded-lg transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <WeatherIconDisplay code={weathercode} iconClassName="w-10 h-10" showDescription={false} />
            <div>
              <p className="font-semibold text-base">{dayName}</p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-base">{Math.round(temperature_2m_max)}° / {Math.round(temperature_2m_min)}°C</p>
            {precipitation_probability_max !== undefined && (
              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                <Umbrella className="w-3 h-3" /> %{precipitation_probability_max}
              </p>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-muted/20 rounded-b-lg">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{getWeatherInfo(weathercode).description}</p>
          <div className="grid grid-cols-2 gap-2">
            <DetailItem Icon={Sunrise} label="Gün Doğumu" value={format(parseISO(sunrise), 'HH:mm')} />
            <DetailItem Icon={Sunset} label="Gün Batımı" value={format(parseISO(sunset), 'HH:mm')} />
            {uv_index_max !== undefined && <DetailItem Icon={UVIndexIcon} label="Max UV İndeksi" value={uv_index_max.toFixed(1)} />}
            {precipitation_probability_max !== undefined && <DetailItem Icon={Umbrella} label="Yağış İhtimali" value={`%${precipitation_probability_max}`} />}
          </div>
          {hourlyDataForDay && (
             <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Detaylı Saatlik:</p>
                {hourlyDataForDay.time.slice(0,6).map((t, idx) => ( // Show first 6 hours for brevity
                    <div key={t} className="flex justify-between items-center text-xs p-1 bg-background/50 rounded">
                        <span>{format(parseISO(t), 'HH:mm')}</span>
                        <span><Thermometer className="w-3 h-3 inline mr-1"/>{hourlyDataForDay.temperature_2m[idx].toFixed(0)}°C</span>
                        <span><Droplets className="w-3 h-3 inline mr-1"/>%{hourlyDataForDay.relative_humidity_2m[idx]}</span>
                        <span><Wind className="w-3 h-3 inline mr-1"/>{hourlyDataForDay.windspeed_10m[idx].toFixed(0)}km/s</span>
                    </div>
                ))}
             </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Helper function from weatherIcons, simplified
function getWeatherInfo(code: number) {
  // This should ideally call the full getWeatherInfo from lib/weatherIcons
  // For simplicity, a placeholder:
  if (code >= 0 && code <= 3) return { description: "Genellikle Açık" };
  if (code >= 51 && code <= 67) return { description: "Yağmurlu" };
  if (code >= 71 && code <= 77) return { description: "Karlı" };
  return { description: "Değişken" };
}
