'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteLocationCard } from '@/components/FavoriteLocationCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeartOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show a loading state or skeleton for SSR/initial load
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Favoriler yükleniyor...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center">
        <HeartOff className="h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-2">Henüz Favori Eklenmemiş</h2>
        <p className="text-muted-foreground mb-6">
          Beğendiğiniz konumları favorilerinize ekleyerek buradan hızlıca ulaşabilirsiniz.
        </p>
        <Button asChild size="lg">
          <Link href="/">Konum Keşfet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Favori Konumlarım</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(location => (
          <FavoriteLocationCard key={`${location.province}-${location.district}`} location={location} />
        ))}
      </div>
    </div>
  );
}
