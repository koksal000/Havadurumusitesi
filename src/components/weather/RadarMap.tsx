
'use client';

import { Button } from '@/components/ui/button';
import { Expand, Minimize } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface RadarMapProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  mapHeight?: number | string;
}

export function RadarMap({ lat = 39.9208, lon = 32.8541, zoom = 6, mapHeight = 500 }: RadarMapProps) {
  const mapUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&rmt=0&c=2&o=True&lm=1&th=0&sm=1&sn=1&lg=tr`;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleToggleFullScreen = () => {
    if (!iframeRef.current) return;

    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        alert(`Tam ekran modu etkinleştirilemedi: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, []);


  return (
    <div className="relative w-full" style={{ height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight }}>
      <iframe
        ref={iframeRef}
        src={mapUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="RainViewer Radar Haritası"
        className="rounded-md border block"
      ></iframe>
      <Button
        onClick={handleToggleFullScreen}
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background text-foreground"
        aria-label={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
      >
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
      </Button>
    </div>
  );
}
