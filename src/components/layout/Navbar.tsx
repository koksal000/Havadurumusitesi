
'use client'; 

import Link from 'next/link';
import { CloudSun, Menu, Search as SearchIcon, Heart, Radar as RadarIcon } from 'lucide-react'; // Added Menu icon
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function Navbar() {
  const { toggleSidebar } = useSidebar(); 

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
           <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden" 
            onClick={toggleSidebar}
            aria-label="Menüyü Aç/Kapat"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center gap-2" aria-label="HavaDurumuX Ana Sayfa">
            <CloudSun className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">HavaDurumuX</span>
          </Link>
        </div>
        
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild size="sm">
            <Link href="/kesfet"><SearchIcon className="mr-1 h-4 w-4" />Keşfet</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/favoriler"><Heart className="mr-1 h-4 w-4" />Favorilerim</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/radar"><RadarIcon className="mr-1 h-4 w-4" />Radar</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="icon" 
            className="hidden md:inline-flex h-9 w-9" 
            onClick={toggleSidebar}
            aria-label="Kenar Çubuğunu Aç/Kapat"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
