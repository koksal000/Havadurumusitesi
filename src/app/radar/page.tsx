
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarMap } from '@/components/weather/RadarMap'; // Re-using the simple radar map

export default function RadarPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Gelişmiş Radar Haritası</h1>
      
      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle>Canlı Yağış ve Bulut Takibi</CardTitle>
          <CardDescription>
            RainViewer ile anlık ve gelecek 2 saate kadar bulut hareketlerini ve yağış yoğunluğunu takip edin.
            Harita üzerinde fare tekerleği ile yakınlaşıp uzaklaşabilir, sürükleyerek farklı bölgeleri görüntüleyebilirsiniz.
            Sağ alttaki kontroller ile animasyonu başlatabilir, durdurabilir ve katmanları değiştirebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The RadarMap component already includes the iframe, height increased */}
          <RadarMap zoom={5} mapHeight={650} /> 
          <div className="mt-4 text-sm text-muted-foreground space-y-2">
            <p><strong>Özellikler (Entegrasyon Geliştirildikçe Eklenecektir):</strong></p>
            <ul className="list-disc list-inside pl-4">
              <li>OpenStreetMap tabanlı interaktif harita.</li>
              <li>Gelecek 2 saat için bulut hareket animasyonu.</li>
              <li>Yoğunluk derecelerini gösteren renk skalası.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
