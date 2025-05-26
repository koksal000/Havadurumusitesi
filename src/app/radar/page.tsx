
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RadarPage() {
  // Rainviewer URL structure: https://www.rainviewer.com/map.html?loc=LAT,LON,ZOOM&oFa=0&oC=0&oU=0&oCS=1&oF=1&oAP=1&rmt=4&c=3&o=True&lm=False&th=1&sm=False&sn=False
  // Centered on Turkey with a suitable zoom level. Using specific params for a cleaner map.
  const rainviewerEmbedUrl = "https://www.rainviewer.com/map.html?loc=39,35,5&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&rmt=0&c=2&o=True&lm=1&th=0&sm=1&sn=1&lg=tr&lat=39&lng=35&zoom=5&state=1&frequency=120";

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col"> {/* Adjust height based on Navbar and padding */}
      <Card className="shadow-xl rounded-xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Canlı Yağış ve Bulut Takibi (RainViewer)</CardTitle>
          <CardDescription>
            RainViewer ile anlık ve gelecek 2 saate kadar bulut hareketlerini ve yağış yoğunluğunu takip edin.
            Harita üzerinde fare tekerleği ile yakınlaşıp uzaklaşabilir, sürükleyerek farklı bölgeleri görüntüleyebilirsiniz.
            Sağ alttaki kontroller ile animasyonu başlatabilir, durdurabilir ve katmanları değiştirebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 m-0 overflow-hidden rounded-b-xl">
          <iframe
            src={rainviewerEmbedUrl}
            width="100%"
            height="100%" // Fill the CardContent
            frameBorder="0"
            allowFullScreen
            title="RainViewer Radar Haritası"
            className="block" // Ensure iframe takes full block space
          ></iframe>
        </CardContent>
      </Card>
       <div className="mt-4 text-sm text-muted-foreground space-y-2 text-center">
            <p><strong>Not:</strong> Harita RainViewer tarafından sağlanmaktadır. Performans ve özellikler harici servise bağlıdır.</p>
       </div>
    </div>
  );
}
