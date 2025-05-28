
import type { DailyWeather as DailyWeatherType, HourlyWeather } from '@/types/weather';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Sunrise, Sunset, Thermometer, Droplets, Wind, Zap, Umbrella, Clock, CloudSun, WindIcon, CloudRain, CloudDrizzle, CloudSnow } from 'lucide-react'; // Added CloudSun, WindIcon and missing rain/snow icons
import { getWeatherInfo } from '@/lib/weatherIcons';

interface DailyForecastItemProps {
  dayData: DailyWeatherType; // Use the full daily weather type
  hourlyDataForDay: HourlyWeather | null;
  isToday?: boolean;
}

export function DailyForecastItem({ dayData, hourlyDataForDay, isToday = false }: DailyForecastItemProps) {
  const {
    time,
    weather_code,
    temperature_2m_max,
    temperature_2m_min,
    apparent_temperature_max,
    apparent_temperature_min,
    sunrise,
    sunset,
    precipitation_sum,
    rain_sum,
    showers_sum,
    snowfall_sum,
    precipitation_hours,
    precipitation_probability_max,
    wind_speed_10m_max,
    wind_gusts_10m_max,
    wind_direction_10m_dominant,
    uv_index_max
  } = dayData;

  const date = parseISO(time);
  const dayName = isToday ? "Bugün" : format(date, 'eeee', { locale: tr });
  const formattedDate = format(date, 'dd MMM', { locale: tr });

  const DetailItem = ({ Icon, label, value, unit }: { Icon: React.ElementType, label: string, value: string | number | undefined, unit?: string }) => {
    if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
      return null;
    }
    return (
    <div className="flex items-center gap-2 text-xs p-1.5 bg-background rounded">
      <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span>{label}:</span>
      <span className="font-medium">{value}{unit}</span>
    </div>
  )};

  return (
    <AccordionItem value={time} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="hover:bg-accent/50 px-4 py-3 rounded-lg transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <WeatherIconDisplay code={weather_code} iconClassName="w-10 h-10" showDescription={false} />
            <div>
              <p className="font-semibold text-base">{dayName}</p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-base">{Math.round(temperature_2m_max)}° / {Math.round(temperature_2m_min)}°C</p>
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <Umbrella className="w-3 h-3" /> %{precipitation_probability_max ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">{getWeatherInfo(weather_code, true).description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-muted/20 rounded-b-lg">
        <div className="space-y-3">
          <p className="text-sm font-semibold mb-2">{getWeatherInfo(weather_code, true).description}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <DetailItem Icon={Thermometer} label="Hissedilen Max" value={Math.round(apparent_temperature_max)} unit="°C" />
            <DetailItem Icon={Thermometer} label="Hissedilen Min" value={Math.round(apparent_temperature_min)} unit="°C" />
            <DetailItem Icon={Sunrise} label="Gün Doğumu" value={sunrise ? format(parseISO(sunrise), 'HH:mm') : 'N/A'} />
            <DetailItem Icon={Sunset} label="Gün Batımı" value={sunset ? format(parseISO(sunset), 'HH:mm') : 'N/A'} />
            <DetailItem Icon={Umbrella} label="Toplam Yağış" value={precipitation_sum?.toFixed(1)} unit="mm" />
            {rain_sum !== undefined && rain_sum > 0 && <DetailItem Icon={CloudRain} label="Yağmur Toplamı" value={rain_sum?.toFixed(1)} unit="mm" />}
            {showers_sum !== undefined && showers_sum > 0 && <DetailItem Icon={CloudDrizzle} label="Sağanak Toplamı" value={showers_sum?.toFixed(1)} unit="mm" />}
            {snowfall_sum !== undefined && snowfall_sum > 0 && <DetailItem Icon={CloudSnow} label="Kar Toplamı" value={snowfall_sum?.toFixed(1)} unit="cm" />}
            <DetailItem Icon={Clock} label="Yağış Süresi" value={precipitation_hours?.toFixed(0)} unit=" sa" />
            <DetailItem Icon={Wind} label="Max Rüzgar" value={wind_speed_10m_max?.toFixed(1)} unit=" km/s" />
            <DetailItem Icon={WindIcon} label="Max Hamle" value={wind_gusts_10m_max?.toFixed(1)} unit=" km/s" />
            <DetailItem Icon={CloudSun} label="Dominant Rüzgar Yönü" value={wind_direction_10m_dominant} unit="°" />
            <DetailItem Icon={Zap} label="Max UV İndeksi" value={uv_index_max?.toFixed(1)} />
          </div>
          {hourlyDataForDay && hourlyDataForDay.time && hourlyDataForDay.time.length > 0 && (
             <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Öne Çıkan Saatlik Detaylar:</p>
                <div className="space-y-1">
                {/* Show a few key hourly details, e.g., morning, noon, evening */}
                {[hourlyDataForDay.time.findIndex(t => parseISO(t).getHours() >= 8),
                  hourlyDataForDay.time.findIndex(t => parseISO(t).getHours() >= 12),
                  hourlyDataForDay.time.findIndex(t => parseISO(t).getHours() >= 18)]
                  .map(idx => (idx !== -1 && hourlyDataForDay.time?.[idx] && hourlyDataForDay.weather_code?.[idx] !== undefined && hourlyDataForDay.temperature_2m?.[idx] !== undefined && hourlyDataForDay.relative_humidity_2m?.[idx] !== undefined) ? idx : -1) // Ensure all data points exist for the index
                  .filter(idx => idx !== -1) // Filter out invalid indices
                  .slice(0,3) // Max 3 items
                  .map((idx) => (
                    <div key={hourlyDataForDay.time[idx]} className="grid grid-cols-4 gap-1 items-center text-xs p-1 bg-background/50 rounded">
                        <span className="font-medium">{format(parseISO(hourlyDataForDay.time[idx]), 'HH:mm')}</span>
                        <span className="flex items-center gap-0.5"><WeatherIconDisplay code={hourlyDataForDay.weather_code[idx]} isDay={parseISO(hourlyDataForDay.time[idx]).getHours() > 6 && parseISO(hourlyDataForDay.time[idx]).getHours() < 20} iconClassName="w-4 h-4" showDescription={false} /></span>
                        <span className="truncate"><Thermometer className="w-3 h-3 inline mr-0.5"/>{hourlyDataForDay.temperature_2m[idx].toFixed(0)}°C</span>
                        <span className="truncate"><Droplets className="w-3 h-3 inline mr-0.5"/>%{hourlyDataForDay.relative_humidity_2m[idx]}</span>
                    </div>
                ))}
                </div>
             </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
