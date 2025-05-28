
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

interface HumidityChartProps {
  hourlyWeather: HourlyWeather;
  chartHeight?: string;
}

const SLICE_HOURS = 24;

export function HumidityChart({ hourlyWeather, chartHeight = "300px" }: HumidityChartProps) {
  const chartData = (hourlyWeather?.time || []).slice(0, SLICE_HOURS).map((time, index) => ({
    time: format(parseISO(time), 'HH:mm'),
    date: parseISO(time),
    'Bağıl Nem (%)': hourlyWeather?.relative_humidity_2m?.[index] ?? null,
  })).filter(d => d['Bağıl Nem (%)'] !== null);

  const chartConfig = {
    humidity: {
      label: "Bağıl Nem (%)",
      color: "hsl(var(--chart-3))",
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bağıl Nem</CardTitle>
          <CardDescription>Saatlik bağıl nem oranı (ilk 24 saat)</CardDescription>
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
        <CardTitle>Bağıl Nem</CardTitle>
        <CardDescription>Saatlik bağıl nem oranı (ilk 24 saat)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: chartHeight, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
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
              <Line type="monotone" dataKey="Bağıl Nem (%)" stroke="var(--color-humidity)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Bağıl Nem" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
