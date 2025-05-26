
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expand, Minimize } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function RadarPage() {
  const rainviewerEmbedUrl = "https://www.rainviewer.com/map.html?loc=39,35,5&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&rmt=0&c=2&o=True&lm=1&th=0&sm=1&sn=1&lg=tr&lat=39&lng=35&zoom=5&state=1&frequency=120";
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
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col">
      <Card className="shadow-xl rounded-xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Canlı Yağış ve Bulut Takibi (RainViewer)</CardTitle>
          <CardDescription>
            RainViewer ile anlık ve gelecek 2 saate kadar bulut hareketlerini ve yağış yoğunluğunu takip edin.
            Harita üzerinde fare tekerleği ile yakınlaşıp uzaklaşabilir, sürükleyerek farklı bölgeleri görüntüleyebilirsiniz.
            Sağ alttaki kontroller ile animasyonu başlatabilir, durdurabilir ve katmanları değiştirebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 m-0 overflow-hidden rounded-b-xl relative">
          <iframe
            ref={iframeRef}
            src={rainviewerEmbedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title="RainViewer Radar Haritası"
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
       <div className="mt-4 text-sm text-muted-foreground space-y-2 text-center">
            <p><strong>Not:</strong> Harita RainViewer tarafından sağlanmaktadır. Performans ve özellikler harici servise bağlıdır.</p>
       </div>
    </div>
  );
}
