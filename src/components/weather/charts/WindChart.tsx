
'use client';

import type { HourlyWeather } from '@/types/weather';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface WindChartProps {
  hourlyWeather: HourlyWeather;
  chartHeight?: string;
}

const SLICE_HOURS = 24;

export function WindChart({ hourlyWeather, chartHeight = "300px" }: WindChartProps) {
  const chartData = (hourlyWeather?.time || []).slice(0, SLICE_HOURS).map((time, index) => ({
    time: format(parseISO(time), 'HH:mm'),
    date: parseISO(time),
    'Rüzgar Hızı (km/s)': hourlyWeather?.wind_speed_10m?.[index] ?? null,
    'Rüzgar Hamlesi (km/s)': hourlyWeather?.wind_gusts_10m?.[index] ?? null,
  })).filter(d => d['Rüzgar Hızı (km/s)'] !== null);

   const chartConfig = {
    speed: {
      label: "Rüzgar Hızı (km/s)",
      color: "hsl(var(--chart-1))",
    },
    gust: {
      label: "Rüzgar Hamlesi (km/s)",
      color: "hsl(var(--chart-2))",
    },
  };

  if (chartData.length === 0) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Rüzgar Durumu</CardTitle>
          <CardDescription>Saatlik rüzgar hızı ve hamlesi (ilk 24 saat)</CardDescription>
        </CardHeader>
        <CardContent style={{ height: chartHeight }}>
          <p className="text-muted-foreground text-center">Grafik için yeterli veri bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rüzgar Durumu</CardTitle>
        <CardDescription>Saatlik rüzgar hızı ve hamlesi (ilk 24 saat)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: chartHeight, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit="km/s" domain={['auto', 'auto']} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    labelFormatter={(value, payload) => {
                       if (payload && payload.length > 0 && payload[0].payload.date) {
                         return format(payload[0].payload.date, "HH:mm, dd MMM", { locale: tr });
                       }
                       return value;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="Rüzgar Hızı (km/s)" stroke="var(--color-speed)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Rüzgar Hızı" />
              <Line type="monotone" dataKey="Rüzgar Hamlesi (km/s)" stroke="var(--color-gust)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Rüzgar Hamlesi" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
