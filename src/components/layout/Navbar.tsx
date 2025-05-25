import Link from 'next/link';
import { CloudSun } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="HavaDurumuX Ana Sayfa">
          <CloudSun className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">HavaDurumuX</span>
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/">Keşfet</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/favoriler">Favorilerim</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/radar">Radar Haritası</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Mobile Menu Trigger (optional, for future enhancement) */}
          {/* <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button> */}
        </div>
      </div>
    </header>
  );
}
