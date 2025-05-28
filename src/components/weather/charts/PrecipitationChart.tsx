
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
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PrecipitationChartProps {
  hourlyWeather: HourlyWeather;
  chartHeight?: string;
}

const SLICE_HOURS = 24;

export function PrecipitationChart({ hourlyWeather, chartHeight = "300px" }: PrecipitationChartProps) {
  const chartData = (hourlyWeather?.time || []).slice(0, SLICE_HOURS).map((time, index) => ({
    time: format(parseISO(time), 'HH:mm'),
    date: parseISO(time),
    'Yağış İhtimali (%)': hourlyWeather?.precipitation_probability?.[index] ?? null,
    'Yağış Miktarı (mm)': hourlyWeather?.precipitation?.[index] ?? null,
  })).filter(d => d['Yağış İhtimali (%)'] !== null || d['Yağış Miktarı (mm)'] !== null);

  const chartConfig = {
    probability: {
      label: "Yağış İhtimali (%)",
      color: "hsl(var(--chart-1))",
    },
    amount: {
      label: "Yağış Miktarı (mm)",
      color: "hsl(var(--chart-2))",
    },
  };

  if (chartData.length === 0) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Yağış Tahmini</CardTitle>
          <CardDescription>Saatlik yağış ihtimali ve miktarı (ilk 24 saat)</CardDescription>
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
        <CardTitle>Yağış Tahmini</CardTitle>
        <CardDescription>Saatlik yağış ihtimali ve miktarı (ilk 24 saat)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: chartHeight, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" orientation="left" stroke="var(--color-probability)" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-amount)" tick={{ fontSize: 10 }} unit="mm" domain={['auto', 'auto']} />
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
              <Line yAxisId="left" type="monotone" dataKey="Yağış İhtimali (%)" stroke="var(--color-probability)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Yağış İhtimali" />
              <Bar yAxisId="right" dataKey="Yağış Miktarı (mm)" fill="var(--color-amount)" radius={[4, 4, 0, 0]} name="Yağış Miktarı" barSize={10} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
