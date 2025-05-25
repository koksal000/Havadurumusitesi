import type { Icon } from 'lucide-react';
import {
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, CloudDrizzle,
  CloudHail, Thermometer, Wind, Sunrise, Sunset, Gauge, Droplets, Eye, Waves, Zap, Snowflake
} from 'lucide-react';

interface WeatherInfo {
  description: string;
  Icon: Icon;
}

const weatherCodeMap: Record<number, WeatherInfo> = {
  0: { description: 'Açık', Icon: Sun },
  1: { description: 'Parçalı Bulutlu', Icon: CloudSun },
  2: { description: 'Bulutlu', Icon: Cloud },
  3: { description: 'Çok Bulutlu', Icon: Cloud },
  45: { description: 'Sisli', Icon: CloudFog },
  48: { description: 'Kırağı Sisi', Icon: CloudFog },
  51: { description: 'Hafif Çisenti', Icon: CloudDrizzle },
  53: { description: 'Orta Çisenti', Icon: CloudDrizzle },
  55: { description: 'Yoğun Çisenti', Icon: CloudDrizzle },
  56: { description: 'Hafif Donan Çisenti', Icon: CloudDrizzle }, // Add Snowflake or combine
  57: { description: 'Yoğun Donan Çisenti', Icon: CloudDrizzle }, // Add Snowflake or combine
  61: { description: 'Hafif Yağmurlu', Icon: CloudRain },
  63: { description: 'Orta Yağmurlu', Icon: CloudRain },
  65: { description: 'Şiddetli Yağmurlu', Icon: CloudRain },
  66: { description: 'Hafif Donan Yağmur', Icon: CloudRain }, // Add Snowflake or combine
  67: { description: 'Yoğun Donan Yağmur', Icon: CloudRain }, // Add Snowflake or combine
  71: { description: 'Hafif Kar Yağışlı', Icon: CloudSnow },
  73: { description: 'Orta Kar Yağışlı', Icon: CloudSnow },
  75: { description: 'Yoğun Kar Yağışlı', Icon: CloudSnow },
  77: { description: 'Kar Taneleri', Icon: Snowflake },
  80: { description: 'Hafif Sağanak Yağmur', Icon: CloudRain },
  81: { description: 'Orta Sağanak Yağmur', Icon: CloudRain },
  82: { description: 'Şiddetli Sağanak Yağmur', Icon: CloudRain },
  85: { description: 'Hafif Kar Sağanağı', Icon: CloudSnow },
  86: { description: 'Yoğun Kar Sağanağı', Icon: CloudSnow },
  95: { description: 'Gök Gürültülü Fırtına', Icon: CloudLightning },
  96: { description: 'Hafif Dolu ile Fırtına', Icon: CloudHail },
  99: { description: 'Yoğun Dolu ile Fırtına', Icon: CloudHail },
};

export const getWeatherInfo = (code: number, isDay: boolean = true): WeatherInfo => {
  const info = weatherCodeMap[code];
  if (info) {
    if (code === 0 && !isDay) { // Night and clear
      return { description: 'Açık (Gece)', Icon: MoonIcon }; // Placeholder for MoonIcon
    }
    return info;
  }
  return { description: 'Bilinmiyor', Icon: Thermometer }; // Default icon
};

// Placeholder for MoonIcon if not directly available in Lucide, or use a generic night icon
const MoonIcon = (props: React.ComponentProps<typeof Sun>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);


// Other icons for direct use:
export { Thermometer, Wind, Sunrise, Sunset, Gauge, Droplets, Eye, Waves, Zap as UVIndexIcon };
