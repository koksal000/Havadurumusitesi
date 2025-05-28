
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun, Target, Eye, Zap, Code, Users, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default function HakkimizdaPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <CloudSun className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">HavaDurumuX Hakkında</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Türkiye'nin hava durumu ihtiyaçlarına modern ve kapsamlı bir çözüm.
        </p>
      </div>

      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">Misyonumuz</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            HavaDurumuX olarak misyonumuz, Türkiye'deki herkes için en doğru, en hızlı ve en anlaşılır hava durumu bilgilerini sunmaktır.
            Gelişmiş teknolojileri kullanarak, kullanıcılarımızın günlük yaşamlarını planlamalarına, seyahatlerini güvenle yapmalarına
            ve hava koşullarına karşı her zaman hazırlıklı olmalarına yardımcı olmayı hedefliyoruz.
          </p>
          <p>
            Çiftçiden öğrenciye, seyahat edenden açık hava sporcusuna kadar herkesin ihtiyaç duyabileceği detaylı verileri,
            kullanıcı dostu bir arayüzle sunarak hava durumu takibini keyifli bir deneyime dönüştürmeyi amaçlıyoruz.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">Vizyonumuz</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Vizyonumuz, Türkiye'nin en güvenilir ve en çok tercih edilen hava durumu platformu olmaktır. Sürekli gelişen teknolojiyi
            ve meteorolojik yenilikleri takip ederek, kullanıcılarımıza daima en iyi hizmeti sunmayı, veri doğruluğunu en üst
            düzeyde tutmayı ve hava durumu bilincini artırmayı hedefliyoruz. Gelecekte, kişiselleştirilmiş uyarılar,
            yapay zeka destekli tahminler ve topluluk tabanlı hava durumu raporlamaları gibi özelliklerle platformumuzu
            daha da zenginleştirmeyi planlıyoruz.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureItem Icon={Zap} title="Hızlı ve Güvenilir Veri" description="Open-Meteo gibi güvenilir kaynaklardan anlık veri akışı." />
        <FeatureItem Icon={Code} title="Modern Teknoloji" description="Next.js, React ve Tailwind CSS ile geliştirilmiş performanslı bir platform." />
        <FeatureItem Icon={Users} title="Kullanıcı Odaklı Tasarım" description="Kolay anlaşılır, sezgisel ve erişilebilir arayüz." />
        <FeatureItem Icon={TrendingUp} title="Sürekli Gelişim" description="Geri bildirimlerinizi önemsiyor, platformumuzu sürekli iyileştiriyoruz." />
      </div>
      
      <div className="text-center mt-10">
        <Image 
            src="https://i.ibb.co/p6JH9Fg9/copilot-image-1748418745923.png" 
            alt="HavaDurumuX Banner" 
            width={800} 
            height={200} 
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="weather app banner"
            />
        <p className="text-sm text-muted-foreground mt-4">HavaDurumuX ile her zaman bir adım önde olun.</p>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  Icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureItem({ Icon, title, description }: FeatureItemProps) {
  return (
    <Card className="p-6 text-center shadow-lg rounded-xl hover:shadow-xl transition-shadow">
      <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}
