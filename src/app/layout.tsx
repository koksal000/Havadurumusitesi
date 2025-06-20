
"use client"; 

import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from "@/components/ui/toaster";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { CloudSun, Search, Map, Radar, Heart, Settings, Info, Mail, Home, Zap, Bell, Compass, Download } from 'lucide-react';
import { SoundProvider } from '@/contexts/SoundContext';
import ClientSideWeatherInitializer from '@/components/layout/ClientSideWeatherInitializer';
import { useToast } from "@/components/ui/use-toast"; 
import { toast as globalToast } from "@/components/ui/use-toast"; // Renamed to avoid conflict
import { Inter } from 'next/font/google'; // Moved Inter import here

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });


const RootLayoutClientContent = ({ children }: { children: React.ReactNode }) => {
  const { toast: localToast } = useToast(); // Use a different name if there's a conflict, or ensure it's correctly scoped

  const handleDownloadOfflineVersion = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); 
    try {
      const response = await fetch('/havadurumux-offline.html?t=' + new Date().getTime());
      if (!response.ok) {
        throw new Error(`Dosya indirilemedi: ${response.statusText} (${response.status})`);
      }
      const fileContent = await response.text();
      const blob = new Blob([fileContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'havadurumux-offline-surumu.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      globalToast({ // Assuming globalToast is what you intend for this application-wide notification
        title: "İndirme Başarılı",
        description: "HavaDurumuX çevrimdışı sürümü indirildi.",
      });
    } catch (error) {
      console.error("Çevrimdışı sürüm indirilirken hata:", error);
      globalToast({ 
        title: "İndirme Başarısız",
        description: `Çevrimdışı sürüm indirilirken bir sorun oluştu. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <CloudSun className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-sidebar-foreground">HavaDurumuX</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col justify-between">
          <SidebarMenu className="flex-grow">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/kesfet"><Search className="mr-2 h-5 w-5" />Keşfet</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/mevcut-konum"><Compass className="mr-2 h-5 w-5" />Mevcut Konumum</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/bildirimler"><Bell className="mr-2 h-5 w-5" />Bildirimler</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/haritalar/sicaklik-ruzgar"><Map className="mr-2 h-5 w-5" />Sıcaklık ve Rüzgar Haritası</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/radar"><Radar className="mr-2 h-5 w-5" />Radar Görüntüleri Haritası</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/haritalar/simsek-radar"><Zap className="mr-2 h-5 w-5" />Şimşek Radar Haritası</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/favoriler"><Heart className="mr-2 h-5 w-5" />Kayıtlı Konumlar</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton 
                onClick={handleDownloadOfflineVersion} 
                className="w-full justify-start text-base py-2.5"
              >
                 <Download className="mr-2 h-5 w-5" />İnternetsiz Sürümü İndir
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/ayarlar"><Settings className="mr-2 h-5 w-5" />Ayarlar</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/hakkimizda"><Info className="mr-2 h-5 w-5" />Hakkımızda</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                <Link href="/iletisim"><Mail className="mr-2 h-5 w-5" />İletişim</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="w-full justify-start text-base py-2.5">
                  <Link href="/"><Home className="mr-2 h-5 w-5" />Ana Sayfaya Dön</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <Toaster />
          <ClientSideWeatherInitializer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* 
          Metadata cannot be exported from a Client Component.
          It should be defined in Server Components or at the page level if layout is client.
          Since layout is now client, we'll keep it here but be mindful for more complex scenarios.
          For a production app, consider moving to a Server Component or using dynamic metadata generation
          if this layout truly needs to be a client component.
        */}
        <title>HavaDurumuX - Türkiye Hava Durumu</title>
        <meta name="description" content="Türkiye için detaylı hava durumu, tahminler ve radar haritası." />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SoundProvider> 
            <RootLayoutClientContent>{children}</RootLayoutClientContent>
          </SoundProvider> 
        </ThemeProvider>
      </body>
    </html>
  );
}
