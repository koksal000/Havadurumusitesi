
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
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
import { CloudSun, Search, Map, Radar, Heart, Settings, Info, Mail, Home } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HavaDurumuX - Türkiye Hava Durumu',
  description: 'Türkiye için detaylı hava durumu, tahminler ve radar haritası.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
                      <Link href="/favoriler"><Heart className="mr-2 h-5 w-5" />Kayıtlı Konumlar</Link>
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
                <main className="flex-grow container mx-auto px-4 py-8 overflow-auto">
                  {children}
                </main>
                <Toaster />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
