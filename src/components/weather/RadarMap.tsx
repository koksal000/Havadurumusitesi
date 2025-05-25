
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RadarMapProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  mapHeight?: number; // Added prop for height
}

export function RadarMap({ lat = 39.9208, lon = 32.8541, zoom = 6, mapHeight = 500 }: RadarMapProps) {
  // Rainviewer URL structure: https://www.rainviewer.com/map.html?loc=LAT,LON,ZOOM&oFa=0&oC=0&oU=0&oCS=1&oF=1&oAP=1&rmt=4&c=3&o=True&lm=False&th=1&sm=False&sn=False
  const mapUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&rmt=0&c=2&o=True&lm=1&th=0&sm=1&sn=1`;

  return (
    // Removed wrapping Card to allow RadarPage to control its presentation
    <iframe
      src={mapUrl}
      width="100%"
      height={mapHeight} // Use prop for height
      frameBorder="0"
      allowFullScreen
      title="RainViewer Radar Haritası"
      className="rounded-md border"
    ></iframe>
  );
}
