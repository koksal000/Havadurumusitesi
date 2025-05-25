'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProvinces, getDistricts, findDistrict } from '@/lib/locationData';
import type { District } from '@/types/location';
import { MapPin, Search, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  useEffect(() => {
    setProvinces(getProvinces());
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      setDistricts(getDistricts(selectedProvince));
      setSearchTerm(''); // Reset search term when province changes
      setSelectedDistrict(''); // Reset selected district
    } else {
      setDistricts([]);
    }
  }, [selectedProvince]);

  const filteredDistricts = useMemo(() => {
    if (!searchTerm) return districts;
    return districts.filter(district =>
      district.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, districts]);

  const handleShowWeather = () => {
    if (selectedProvince && selectedDistrict) {
       const districtData = findDistrict(selectedProvince, selectedDistrict);
       if (districtData) {
        router.push(`/konum/${encodeURIComponent(selectedProvince)}/${encodeURIComponent(selectedDistrict)}`);
       } else {
        // Handle case where district is selected but not found (e.g. typed manually and invalid)
        alert("Lütfen geçerli bir ilçe seçin.");
       }
    } else if (selectedProvince && searchTerm && filteredDistricts.length === 1) {
      // If only one district matches search, auto-select it
      router.push(`/konum/${encodeURIComponent(selectedProvince)}/${encodeURIComponent(filteredDistricts[0].name)}`);
    } else {
      alert("Lütfen bir il ve ilçe seçin veya arayın.");
    }
  };

  const popularDistrictsPlaceholder = [
    { province: "İstanbul", district: "Kadıköy", img: "https://placehold.co/300x200.png", dataAiHint: "city istanbul" },
    { province: "Ankara", district: "Çankaya", img: "https://placehold.co/300x200.png", dataAiHint: "city ankara" },
    { province: "İzmir", district: "Alsancak", img: "https://placehold.co/300x200.png", dataAiHint: "city izmir" },
  ];

  return (
    <div className="space-y-12">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Hava Durumunu Keşfet</CardTitle>
          <CardDescription className="text-center">
            Türkiye'deki tüm il ve ilçelerin anlık hava durumu bilgilerine ulaşın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="province-select" className="block text-sm font-medium mb-1">İl Seçin</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger id="province-select" aria-label="İl Seçimi">
                  <SelectValue placeholder="Bir il seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(province => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="district-search" className="block text-sm font-medium mb-1">İlçe Ara veya Seç</label>
              <div className="relative">
                <Input
                  id="district-search"
                  type="text"
                  placeholder={selectedProvince ? "İlçe adı yazın veya listeden seçin..." : "Önce il seçin..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // If typed name matches a district, set it as selectedDistrict
                    const matchedDistrict = filteredDistricts.find(d => d.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matchedDistrict) setSelectedDistrict(matchedDistrict.name); else setSelectedDistrict('');
                  }}
                  disabled={!selectedProvince}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {selectedProvince && searchTerm && filteredDistricts.length > 0 && (
                 <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                   {filteredDistricts.map(district => (
                     <Button
                       key={district.name}
                       variant="ghost"
                       className="w-full justify-start p-2 hover:bg-accent"
                       onClick={() => {
                         setSearchTerm(district.name);
                         setSelectedDistrict(district.name);
                       }}
                     >
                       {district.name}
                     </Button>
                   ))}
                 </div>
              )}
            </div>
          </div>
          <Button onClick={handleShowWeather} className="w-full text-lg py-3 mt-4" size="lg" disabled={!selectedProvince || (!selectedDistrict && !searchTerm) || (searchTerm && filteredDistricts.length !==1 && !selectedDistrict) }>
            <MapPin className="mr-2 h-5 w-5" />
            İlçeyi Göster
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center"><TrendingUp className="mr-2 text-primary"/> Popüler İlçeler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDistrictsPlaceholder.map(loc => (
            <Card key={loc.district} className="overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow">
              <Image src={loc.img} alt={loc.district} width={300} height={200} className="w-full h-48 object-cover" data-ai-hint={loc.dataAiHint} />
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{loc.district}, {loc.province}</h3>
                <Button variant="link" className="p-0 mt-2" asChild>
                  <a onClick={(e) => { e.preventDefault(); router.push(`/konum/${encodeURIComponent(loc.province)}/${encodeURIComponent(loc.district)}`); }} href={`/konum/${encodeURIComponent(loc.province)}/${encodeURIComponent(loc.district)}`}>
                    Hava Durumunu Gör
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Türkiye Haritası</h2>
        <Card className="shadow-lg rounded-xl p-2">
          <CardContent>
            <p className="text-muted-foreground mb-4">Hızlı erişim için Türkiye haritası üzerinden il seçimi (Bu özellik yapım aşamasındadır).</p>
            <Image src="https://placehold.co/800x500.png" alt="Türkiye Haritası" width={800} height={500} className="w-full h-auto rounded-md border" data-ai-hint="turkey map" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
