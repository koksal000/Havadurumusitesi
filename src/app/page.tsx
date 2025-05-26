
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun, MapPin, Radar, Compass, Info, Mail, BarChart3, Thermometer, WindIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="space-y-12">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 p-8">
          <div className="flex flex-col items-center text-center">
            <CloudSun className="w-24 h-24 text-primary mb-4" />
            <CardTitle className="text-4xl font-bold tracking-tight">HavaDurumuX</CardTitle>
            <CardDescription className="text-xl text-muted-foreground mt-2">
              Türkiye'nin En Kapsamlı Hava Durumu Platformu
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-8">
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-3">Hava Durumu Parmaklarınızın Ucunda!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              HavaDurumuX ile Türkiye'nin 81 il ve 973 ilçesi için en güncel ve detaylı hava durumu bilgilerine,
              saatlik ve günlük tahminlere, canlı radar ve uydu görüntülerine kolayca ulaşın.
              Favori konumlarınızı kaydedin, seyahatlerinizi planlayın ve hava koşullarına her zaman hazırlıklı olun.
            </p>
          </section>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <FeatureCard
              Icon={MapPin}
              title="Detaylı Konum Bilgisi"
              description="Her ilçe için sıcaklık, hissedilen sıcaklık, nem, basınç, rüzgar yönü/hızı, görüş mesafesi ve UV indeksi gibi ayrıntılı verilere erişin."
            />
            <FeatureCard
              Icon={BarChart3}
              title="Grafiksel Tahminler"
              description="Saatlik ve 7 günlük hava durumu tahminlerini anlaşılır grafikler ve ikonlarla inceleyin. Yağış ihtimali, gündoğumu/günbatımı saatleri ve daha fazlası."
            />
            <FeatureCard
              Icon={Radar}
              title="Canlı Radar ve Haritalar"
              description="Gelişmiş radar görüntüleri ile yağış takibi yapın. Sıcaklık ve rüzgar haritaları ile genel durumu gözlemleyin."
            />
          </div>
          
          <div className="text-center mt-10">
            <Button asChild size="lg" className="text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/kesfet">
                <Compass className="mr-2 h-6 w-6" />
                Hava Durumunu Keşfetmeye Başla
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard
          Icon={Info}
          title="Hakkımızda"
          description="HavaDurumuX'in misyonu ve vizyonu hakkında daha fazla bilgi edinin."
          link="/hakkimizda"
          linkLabel="Daha Fazla Bilgi"
        />
        <InfoCard
          Icon={Mail}
          title="İletişim"
          description="Öneri, şikayet veya işbirliği için bizimle iletişime geçin."
          link="/iletisim"
          linkLabel="İletişime Geç"
        />
      </div>
       <div className="py-6 text-center">
          <Image 
            src="https://placehold.co/1200x300.png" 
            alt="Türkiye haritası üzerinde hava durumu ikonları" 
            width={1200} 
            height={300} 
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="weather map turkey"
            />
            <p className="text-xs text-muted-foreground mt-2">Görsel temsilidir.</p>
       </div>
    </div>
  );
}

interface FeatureCardProps {
  Icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ Icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-card rounded-lg shadow-md border border-border/50 hover:shadow-lg transition-shadow">
      <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface InfoCardProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

function InfoCard({ Icon, title, description, link, linkLabel }: InfoCardProps) {
  return (
    <Card className="shadow-lg rounded-xl hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <Icon className="w-10 h-10 text-primary" />
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href={link}>{linkLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

