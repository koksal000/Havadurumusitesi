
'use client'; // Required for useSidebar hook

import Link from 'next/link';
import { CloudSun, Menu } from 'lucide-react'; // Added Menu icon
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar

export function Navbar() {
  const { toggleSidebar, isMobile } = useSidebar(); // Get toggleSidebar function

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"> {/* z-index lower than sidebar's default (50) */}
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle Button for mobile, or always visible if preferred */}
           <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden" // Show only on md and smaller, or remove md:hidden to always show
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
        
        <nav className="hidden items-center gap-1 md:flex"> {/* Reduced gap for denser nav items */}
          <Button variant="ghost" asChild size="sm">
            <Link href="/">Keşfet</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/favoriler">Favorilerim</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/radar">Radar Haritası</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Desktop Sidebar Toggle Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="hidden md:inline-flex h-9 w-9" // Show only on md and larger, if Navbar Menu button is mobile only
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
