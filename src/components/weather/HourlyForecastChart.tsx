'use client';

import type { HourlyWeather } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getWeatherInfo } from '@/lib/weatherIcons';
import { WeatherIconDisplay } from '../WeatherIconDisplay';

interface HourlyForecastChartProps {
  hourlyWeather: HourlyWeather;
}

// Take first 24 hours
const SLICE_HOURS = 24;

export function HourlyForecastChart({ hourlyWeather }: HourlyForecastChartProps) {
  const chartData = hourlyWeather.time.slice(0, SLICE_HOURS).map((time, index) => ({
    time: format(parseISO(time), 'HH:mm'),
    date: parseISO(time), // For tooltip
    Sıcaklık: hourlyWeather.temperature_2m[index],
    'Yağış İhtimali': hourlyWeather.precipitation_probability[index],
    Rüzgar: hourlyWeather.windspeed_10m[index],
    Nem: hourlyWeather.relative_humidity_2m[index],
    weatherCode: hourlyWeather.weathercode[index],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 border rounded-md shadow-lg">
          <p className="font-semibold">{format(data.date, "eeee, HH:mm", { locale: tr })}</p>
          <WeatherIconDisplay code={data.weatherCode} isDay={new Date(data.date).getHours() > 6 && new Date(data.date).getHours() < 20} iconClassName="w-8 h-8 mx-auto" showDescription={false}/>
          <p className="text-sm text-primary">{`Sıcaklık: ${data.Sıcaklık.toFixed(1)}°C`}</p>
          <p className="text-sm text-blue-500">{`Yağış: %${data['Yağış İhtimali']}`}</p>
          <p className="text-sm text-green-500">{`Rüzgar: ${data.Rüzgar.toFixed(1)} km/s`}</p>
          <p className="text-sm text-indigo-500">{`Nem: %${data.Nem}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>Saatlik Tahmin (24 Saat)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" tick={{ fontSize: 12 }} unit="°C" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" tick={{ fontSize: 12 }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            <Line yAxisId="left" type="monotone" dataKey="Sıcaklık" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey="Yağış İhtimali" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Yağış İhtimali (%)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
