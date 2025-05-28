
import type { DailyWeather as DailyWeatherType, HourlyWeather } from '@/types/weather';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WeatherIconDisplay } from '@/components/WeatherIconDisplay';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Sunrise, Sunset, Thermometer, Droplets, Wind, Zap, Umbrella, Clock, CloudSun, WindIcon as WindGustIcon, CloudRain, CloudDrizzle, CloudSnow, Gauge, Eye } from 'lucide-react';
import { getWeatherInfo } from '@/lib/weatherIcons';

interface DailyForecastItemProps {
  dayData: DailyWeatherType;
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

  const DetailItem = ({ Icon, label, value, unit }: { Icon: React.ElementType, label: string, value?: string | number | null, unit?: string }) => {
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

  const keyHourlyIndices = [
    hourlyDataForDay?.time.findIndex(t => parseISO(t).getHours() === 8),
    hourlyDataForDay?.time.findIndex(t => parseISO(t).getHours() === 12),
    hourlyDataForDay?.time.findIndex(t => parseISO(t).getHours() === 18),
    hourlyDataForDay?.time.findIndex(t => parseISO(t).getHours() === 22),
  ].filter(idx => idx !== undefined && idx !== -1) as number[];


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
            <p className="font-semibold text-base">{Math.round(temperature_2m_max ?? 0)}° / {Math.round(temperature_2m_min ?? 0)}°C</p>
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <Umbrella className="w-3 h-3" /> %{precipitation_probability_max?.[0] ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">{getWeatherInfo(weather_code, true).description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-muted/20 rounded-b-lg">
        <div className="space-y-3">
          <p className="text-sm font-semibold mb-2">{getWeatherInfo(weather_code, true).description}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <DetailItem Icon={Thermometer} label="Hissedilen Max" value={Math.round(apparent_temperature_max ?? 0)} unit="°C" />
            <DetailItem Icon={Thermometer} label="Hissedilen Min" value={Math.round(apparent_temperature_min ?? 0)} unit="°C" />
            <DetailItem Icon={Sunrise} label="Gün Doğumu" value={sunrise ? format(parseISO(sunrise), 'HH:mm', { locale: tr }) : 'N/A'} />
            <DetailItem Icon={Sunset} label="Gün Batımı" value={sunset ? format(parseISO(sunset), 'HH:mm', { locale: tr }) : 'N/A'} />
            <DetailItem Icon={Umbrella} label="Toplam Yağış" value={precipitation_sum?.toFixed(1)} unit="mm" />
            {(rain_sum ?? 0) > 0 && <DetailItem Icon={CloudRain} label="Yağmur Toplamı" value={rain_sum?.toFixed(1)} unit="mm" />}
            {(showers_sum ?? 0) > 0 && <DetailItem Icon={CloudDrizzle} label="Sağanak Toplamı" value={showers_sum?.toFixed(1)} unit="mm" />}
            {(snowfall_sum ?? 0) > 0 && <DetailItem Icon={CloudSnow} label="Kar Toplamı" value={snowfall_sum?.toFixed(1)} unit="cm" />}
            <DetailItem Icon={Clock} label="Yağış Süresi" value={precipitation_hours?.toFixed(0)} unit=" sa" />
            <DetailItem Icon={Wind} label="Max Rüzgar" value={wind_speed_10m_max?.toFixed(1)} unit=" km/s" />
            <DetailItem Icon={WindGustIcon} label="Max Hamle" value={wind_gusts_10m_max?.toFixed(1)} unit=" km/s" />
            <DetailItem Icon={CloudSun} label="Dominant Rüzgar Yönü" value={wind_direction_10m_dominant} unit="°" />
            <DetailItem Icon={Zap} label="Max UV İndeksi" value={uv_index_max?.[0]?.toFixed(1)} />
          </div>
          {hourlyDataForDay && hourlyDataForDay.time && hourlyDataForDay.time.length > 0 && keyHourlyIndices.length > 0 && (
             <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Öne Çıkan Saatlik Detaylar ({dayName}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {keyHourlyIndices.map((idx) => {
                    const hourlyTime = hourlyDataForDay.time?.[idx];
                    const hourlyWeatherCode = hourlyDataForDay.weather_code?.[idx];
                    const hourlyTemp = hourlyDataForDay.temperature_2m?.[idx];
                    const hourlyHumidity = hourlyDataForDay.relative_humidity_2m?.[idx];
                    const hourlyPrecipProb = hourlyDataForDay.precipitation_probability?.[idx];
                    const hourlyWindSpeed = hourlyDataForDay.wind_speed_10m?.[idx];
                    const isDayForHour = hourlyDataForDay.is_day?.[idx] === 1;

                    if (hourlyTime === undefined || hourlyWeatherCode === undefined || hourlyTemp === undefined) return null;

                    return (
                        <div key={hourlyTime} className="p-2 bg-background rounded-md shadow-sm text-xs space-y-1">
                            <div className="flex justify-between items-center font-semibold">
                                <span>{format(parseISO(hourlyTime), 'HH:mm', { locale: tr })}</span>
                                <WeatherIconDisplay code={hourlyWeatherCode} isDay={isDayForHour} iconClassName="w-5 h-5" showDescription={false} />
                            </div>
                            <div className="grid grid-cols-2 gap-x-2">
                                <DetailItem Icon={Thermometer} label="Sıcaklık" value={hourlyTemp?.toFixed(0)} unit="°C" />
                                {hourlyPrecipProb !== null && hourlyPrecipProb !== undefined && <DetailItem Icon={Umbrella} label="Yağış İht." value={hourlyPrecipProb} unit="%" />}
                                {hourlyHumidity !== undefined && <DetailItem Icon={Droplets} label="Nem" value={hourlyHumidity?.toFixed(0)} unit="%" />}
                                {hourlyWindSpeed !== undefined && <DetailItem Icon={Wind} label="Rüzgar" value={hourlyWindSpeed?.toFixed(0)} unit="km/s" />}
                            </div>
                        </div>
                    );
                })}
                </div>
             </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

