
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

interface PressureChartProps {
  hourlyWeather: HourlyWeather;
  chartHeight?: string;
}

const SLICE_HOURS = 24;

export function PressureChart({ hourlyWeather, chartHeight = "300px" }: PressureChartProps) {
  const chartData = (hourlyWeather?.time || []).slice(0, SLICE_HOURS).map((time, index) => ({
    time: format(parseISO(time), 'HH:mm'),
    date: parseISO(time),
    'Yüzey Basıncı (hPa)': hourlyWeather?.surface_pressure?.[index] ?? null,
    'Deniz Seviyesi Basıncı (hPa)': hourlyWeather?.pressure_msl?.[index] ?? null,
  })).filter(d => d['Yüzey Basıncı (hPa)'] !== null || d['Deniz Seviyesi Basıncı (hPa)'] !== null);

  const chartConfig = {
    surfacePressure: {
      label: "Yüzey Basıncı (hPa)",
      color: "hsl(var(--chart-1))",
    },
    mslPressure: {
      label: "Deniz Seviyesi Basıncı (hPa)",
      color: "hsl(var(--chart-2))",
    },
  };
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atmosfer Basıncı</CardTitle>
          <CardDescription>Saatlik yüzey ve deniz seviyesi basıncı (ilk 24 saat)</CardDescription>
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
        <CardTitle>Atmosfer Basıncı</CardTitle>
        <CardDescription>Saatlik yüzey ve deniz seviyesi basıncı (ilk 24 saat)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: chartHeight, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit="hPa" domain={['auto', 'auto']} />
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
              {chartData.some(d => d['Yüzey Basıncı (hPa)'] !== null) && (
                <Line type="monotone" dataKey="Yüzey Basıncı (hPa)" stroke="var(--color-surfacePressure)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Yüzey Basıncı" />
              )}
              {chartData.some(d => d['Deniz Seviyesi Basıncı (hPa)'] !== null) && (
                <Line type="monotone" dataKey="Deniz Seviyesi Basıncı (hPa)" stroke="var(--color-mslPressure)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Deniz Seviyesi Basıncı" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
