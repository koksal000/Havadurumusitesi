
// src/app/haritalar/sicaklik-ruzgar/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SicaklikRuzgarHaritasiPage() {
  const ventuskyEmbedUrl = "https://embed.ventusky.com/?p=temperature&l=clouds&z=5&lat=39.0&lon=35.0&projection=VERSATOR&lang=tr";
  // Adjusted zoom (z=5) and center (lat/lon) for a broader view of Turkey. Added projection and lang=tr.

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col"> {/* Adjust height based on Navbar and padding */}
      <Card className="shadow-xl rounded-xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Sıcaklık ve Rüzgar Haritası (Ventusky)</CardTitle>
          <CardDescription>
            Canlı sıcaklık, rüzgar, bulut ve diğer meteorolojik verileri Ventusky haritası üzerinden takip edin.
            Harita üzerinde fare tekerleği ile yakınlaşıp uzaklaşabilir, sürükleyerek farklı bölgeleri görüntüleyebilirsiniz.
            Sağ alt köşedeki menüden farklı katmanları ve ayarları seçebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 m-0 overflow-hidden rounded-b-xl">
          <iframe
            src={ventuskyEmbedUrl}
            width="100%"
            height="100%" // Fill the CardContent
            frameBorder="0"
            allowFullScreen
            title="Sıcaklık ve Rüzgar Haritası - Ventusky"
            className="block" // Ensure iframe takes full block space
          ></iframe>
        </CardContent>
      </Card>
    </div>
  );
}
