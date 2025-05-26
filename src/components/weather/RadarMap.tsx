
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RadarMapProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  mapHeight?: number | string; // Allow string for "100%"
}

export function RadarMap({ lat = 39.9208, lon = 32.8541, zoom = 6, mapHeight = 500 }: RadarMapProps) {
  const mapUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&rmt=0&c=2&o=True&lm=1&th=0&sm=1&sn=1&lg=tr`;

  return (
    <iframe
      src={mapUrl}
      width="100%"
      style={{ height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight }}
      frameBorder="0"
      allowFullScreen
      title="RainViewer Radar Haritası"
      className="rounded-md border block" // Added block
    ></iframe>
  );
}
