
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, ExternalLink, Info, MessageSquareHeart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function IletisimPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Send className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Bizimle İletişime Geçin</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Soru, öneri veya geri bildirimlerinizi duymaktan mutluluk duyarız!
        </p>
      </div>

      <Card className="shadow-xl rounded-xl max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquareHeart className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">Geri Bildirimleriniz Değerli</CardTitle>
          </div>
          <CardDescription>
            HavaDurumuX'i daha iyi bir platform haline getirmemize yardımcı olun.
            Her türlü düşüncenizi ve önerinizi bizimle paylaşabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Şu anda özel bir iletişim formumuz bulunmamaktadır. Ancak, gelecekteki güncellemelerimizle birlikte
            daha doğrudan iletişim kanalları eklemeyi planlıyoruz.
          </p>
          <p className="text-muted-foreground">
            Platformumuzla ilgili genel bilgiler, güncellemeler ve duyurular için lütfen aşağıdaki web sitemizi
            ziyaret edin:
          </p>
          <div className="text-center">
            <Button asChild size="lg" variant="default" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="https://havadurumu.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-5 w-5" />
                havadurumu.com (Şimdilik Site Linkimiz)
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            (Lütfen unutmayın, bu link şu an için bir yer tutucudur ve gerçek bir siteye yönlendirmeyebilir.)
          </p>
        </CardContent>
      </Card>

      <div className="text-center mt-10">
         <Image 
            src="https://i.ibb.co/p6JH9Fg9/copilot-image-1748418745923.png" 
            alt="HavaDurumuX Banner İletişim" 
            width={700} 
            height={175} 
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="weather app banner contact"
            />
      </div>
    </div>
  );
}
