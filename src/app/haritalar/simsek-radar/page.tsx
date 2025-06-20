
// src/app/haritalar/simsek-radar/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expand, Minimize } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function SimsekRadarHaritasiPage() {
  const blitzortungEmbedUrl = "https://map.blitzortung.org/";
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
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <Card className="shadow-xl rounded-xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Şimşek Radar Haritası (Blitzortung.org)</CardTitle>
          <CardDescription>
            Canlı şimşek ve yıldırım aktivitelerini Blitzortung.org haritası üzerinden takip edin.
            Harita üzerinde kontrolleri kullanarak yakınlaşıp uzaklaşabilir ve farklı bölgeleri görüntüleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 m-0 overflow-hidden rounded-b-xl relative">
          <iframe
            ref={iframeRef}
            src={blitzortungEmbedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            loading="lazy"
            allowFullScreen
            title="Şimşek Radar Haritası - Blitzortung.org"
            className="block"
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
        </CardContent>
      </Card>
    </div>
  );
}

