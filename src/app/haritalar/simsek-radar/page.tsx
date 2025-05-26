
// src/app/haritalar/simsek-radar/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimsekRadarHaritasiPage() {
  const blitzortungEmbedUrl = "https://map.blitzortung.org/";

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col"> {/* Adjust height based on Navbar and padding */}
      <Card className="shadow-xl rounded-xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Şimşek Radar Haritası (Blitzortung.org)</CardTitle>
          <CardDescription>
            Canlı şimşek ve yıldırım aktivitelerini Blitzortung.org haritası üzerinden takip edin.
            Harita üzerinde kontrolleri kullanarak yakınlaşıp uzaklaşabilir ve farklı bölgeleri görüntüleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 m-0 overflow-hidden rounded-b-xl">
          <iframe
            src={blitzortungEmbedUrl}
            width="100%"
            height="100%" // Fill the CardContent
            frameBorder="0"
            loading="lazy"
            allowFullScreen
            title="Şimşek Radar Haritası - Blitzortung.org"
            className="block" // Ensure iframe takes full block space
          ></iframe>
        </CardContent>
      </Card>
    </div>
  );
}
