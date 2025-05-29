
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Brush, Speaker, RotateCcw, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import { useSound } from '@/contexts/SoundContext';

const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';

export default function AyarlarPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { playClickSound, setGlobalSoundEnabled, isSoundGloballyEnabled } = useSound();

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [currentLocationPermission, setCurrentLocationPermission] = useState<PermissionState | null>(null);
  
  const [uiSoundSwitchState, setUiSoundSwitchState] = useState(isSoundGloballyEnabled);

  useEffect(() => {
    setUiSoundSwitchState(isSoundGloballyEnabled);
  }, [isSoundGloballyEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY);
      setLocationServicesEnabled(savedLocationServicesEnabled === 'true');
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
          setCurrentLocationPermission(status.state);
          status.onchange = () => setCurrentLocationPermission(status.state);
        });
      }
    }
  }, []);

  const handleLocationServicesToggle = async (checked: boolean) => {
    playClickSound();
    setLocationServicesEnabled(checked);
    localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(checked));

    if (checked) {
        if (navigator.geolocation && navigator.permissions) {
            let permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            setCurrentLocationPermission(permissionStatus.state);

            if (permissionStatus.state === 'granted') {
                toast({ title: "Konum Servisleri Etkin", description: "Mevcut konumunuz kullanılabilir." });
            } else if (permissionStatus.state === 'prompt') {
                 toast({ title: "Konum İzni Bekleniyor", description: "Tarayıcı konum izni isteyecektir.", variant: "default" });
                 navigator.geolocation.getCurrentPosition(
                    () => { 
                        setCurrentLocationPermission('granted');
                        toast({ title: "Konum İzni Verildi", description: "Mevcut konumunuz kullanılabilir." });
                    },
                    (error) => { 
                        setCurrentLocationPermission('denied');
                        if (error.code === error.PERMISSION_DENIED) {
                            toast({
                                title: "Konum İzni Reddedildi",
                                description: "Konum servislerini kullanmak için izin vermelisiniz.",
                                variant: "destructive",
                            });
                        } else {
                             toast({
                                title: "Konum Alınamadı",
                                description: `Hata: ${error.message}`,
                                variant: "destructive",
                            });
                        }
                        setLocationServicesEnabled(false);
                        localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
                    }
                );
            } else if (permissionStatus.state === 'denied') {
                toast({
                    title: "Konum İzni Reddedilmiş",
                    description: "Tarayıcı ayarlarından konum iznini vermeniz gerekiyor.",
                    variant: "destructive",
                });
                setLocationServicesEnabled(false);
                localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
            }
        } else {
            toast({ title: "Konum Servisleri Desteklenmiyor", description: "Tarayıcınız konum servislerini desteklemiyor.", variant: "destructive" });
            setLocationServicesEnabled(false);
            localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
        }
    } else {
      toast({ title: "Konum Servisleri Devre Dışı", description: "Mevcut konumunuz kullanılmayacak." });
    }
  };

  const handleUiSoundToggle = (checked: boolean) => {
    setGlobalSoundEnabled(checked); 
    if (checked) {
      playClickSound(); 
      toast({ title: "UI Tıklama Sesi Etkin" });
    } else {
      toast({ title: "UI Tıklama Sesi Devre Dışı" });
    }
  };

  const handleResetSettings = () => {
    playClickSound();
    setTheme('light'); 
    localStorage.removeItem('havadurumux-theme');

    setLocationServicesEnabled(false);
    localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
            setCurrentLocationPermission(status.state); 
        });
    } else {
        setCurrentLocationPermission(null); 
    }
    
    setGlobalSoundEnabled(false); 

    toast({ title: "Tüm Temel Ayarlar Sıfırlandı", description: "Uygulama ayarları (tema, konum, ses) varsayılan değerlere döndürüldü." });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brush className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Görünüm</CardTitle>
          </div>
          <CardDescription>Uygulamanın görünüm ayarlarını buradan değiştirebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="theme-toggle-label" className="text-base font-medium">Tema Seçimi</Label>
              <p className="text-sm text-muted-foreground">Açık veya koyu tema arasında geçiş yapın.</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
           <div className="flex items-center gap-3">
            { /* Placeholder for a relevant icon, e.g., MapPin or similar */ }
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin w-7 h-7 text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <CardTitle className="text-2xl">Konum</CardTitle>
          </div>
          <CardDescription>Uygulama konum servislerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
             <div>
              <Label htmlFor="location-switch" className="text-base font-medium">Konum Servisleri</Label>
              <p className="text-sm text-muted-foreground">Mevcut konumunuza göre hava durumu bilgisi için.</p>
            </div>
            <Switch
              id="location-switch"
              checked={locationServicesEnabled && currentLocationPermission === 'granted'}
              onCheckedChange={handleLocationServicesToggle}
              disabled={currentLocationPermission === 'denied'}
            />
          </div>
           {currentLocationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle w-5 h-5"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <p>Tarayıcı konum iznini vermediniz. Ayarlardan değiştirmediğiniz sürece mevcut konumunuz kullanılamaz.</p>
            </div>
          )}
           {locationServicesEnabled && currentLocationPermission === 'prompt' && ( 
            <div className="flex items-center gap-2 p-3 text-sm text-info-foreground bg-info/80 rounded-md">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <p>Tarayıcınız konum izni isteyecektir. Lütfen izin verin.</p>
            </div>
           )}
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
         <div className="flex items-center gap-3">
            <Speaker className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Diğer Ayarlar</CardTitle>
          </div>
          <CardDescription>Ek uygulama tercihlerinizi buradan yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="ui-sound-switch" className="text-base font-medium">UI Tıklama Sesi</Label>
              <p className="text-sm text-muted-foreground">Buton etkileşimlerinde sesli geri bildirim.</p>
            </div>
            <Switch
              id="ui-sound-switch"
              checked={uiSoundSwitchState} 
              onCheckedChange={handleUiSoundToggle}
            />
          </div>

          <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
            <h3 className="text-base font-medium mb-2 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-primary" />Ayarları Sıfırla</h3>
            <p className="text-sm text-muted-foreground mb-3">Tüm temel uygulama ayarlarını (tema, konum servisleri, ses) varsayılan değerlere döndürür.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Tüm Temel Ayarları Sıfırla
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem temel HavaDurumuX ayarlarınızı (tema, konum izinleri, ses)
                    sıfırlayacak ve geri alınamaz. Devam etmek istediğinizden emin misiniz?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSettings}>Sıfırla</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-4">
            Not: Tıklama sesi için tarayıcınızın otomatik oynatma politikaları nedeniyle ilk etkileşimde ses çalmayabilir.
            Ses, harici bir video kaynağından (`https://files.catbox.moe/42qpsz.mp4`) çalınmaktadır.
            Eğer ses yüklenemezse veya çalınamazsa konsolda uyarı görebilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
    

    