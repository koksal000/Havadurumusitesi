import { getWeatherInfo } from '@/lib/weatherIcons';

interface WeatherIconDisplayProps {
  code: number;
  isDay?: boolean;
  className?: string;
  iconClassName?: string;
  descriptionClassName?: string;
  showDescription?: boolean;
}

export function WeatherIconDisplay({
  code,
  isDay = true,
  className,
  iconClassName = "w-12 h-12",
  descriptionClassName = "text-sm",
  showDescription = true,
}: WeatherIconDisplayProps) {
  const { description, Icon } = getWeatherInfo(code, isDay);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Icon className={iconClassName} aria-label={description} />
      {showDescription && <p className={descriptionClassName}>{description}</p>}
    </div>
  );
}
