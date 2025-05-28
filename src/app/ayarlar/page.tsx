
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
import { Brush, Bell, Compass, AlertTriangle, InfoIcon, Speaker, RotateCcw, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import { useSound } from '@/contexts/SoundContext'; // Import useSound

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
const NOTIFICATION_PERMISSION_KEY = 'havadurumux-notification-permission';
const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';
const LOCATION_PERMISSION_KEY = 'havadurumux-location-permission';
const UI_SOUND_ENABLED_KEY = 'havadurumux-ui-sound-enabled';

export default function AyarlarPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme(); 
  const { playClickSound } = useSound(); // Get playClickSound from context

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);

  const [uiSoundEnabled, setUiSoundEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (savedNotificationsEnabled) setNotificationsEnabled(JSON.parse(savedNotificationsEnabled));
      
      if (typeof Notification !== 'undefined') {
        const savedNotificationPerm = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;
        setNotificationPermission(savedNotificationPerm || Notification.permission);
      }

      const savedLocationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY);
      if (savedLocationServicesEnabled) setLocationServicesEnabled(JSON.parse(savedLocationServicesEnabled));
      
      const savedLocationPerm = localStorage.getItem(LOCATION_PERMISSION_KEY) as PermissionState | null;
      if (savedLocationPerm) {
          setLocationPermission(savedLocationPerm);
      } else if (navigator.permissions) {
          navigator.permissions.query({ name: 'geolocation' }).then(status => {
              setLocationPermission(status.state);
              localStorage.setItem(LOCATION_PERMISSION_KEY, status.state);
          });
      }

      const savedUiSoundEnabled = localStorage.getItem(UI_SOUND_ENABLED_KEY);
      if (savedUiSoundEnabled) setUiSoundEnabled(JSON.parse(savedUiSoundEnabled));
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    // playClickSound(); // Sound will be played by the Button component itself
    setNotificationsEnabled(checked);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(checked));

    if (checked) {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          setNotificationPermission('granted');
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
          toast({ title: "Bildirimler Etkin", description: "Hava durumu uyarıları için bildirim alacaksınız." });
        } else if (Notification.permission === 'denied') {
          setNotificationPermission('denied');
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
          toast({
            title: "Bildirim İzni Reddedilmiş",
            description: "Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.",
            variant: "destructive",
          });
          setNotificationsEnabled(false); 
          localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
        } else {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
          if (permission === 'granted') {
            toast({ title: "Bildirim İzni Verildi", description: "Hava durumu uyarıları için bildirim alacaksınız." });
          } else {
            toast({
              title: "Bildirim İzni Verilmedi",
              description: "Önemli hava durumu uyarılarını alamayacaksınız.",
              variant: "destructive",
            });
            setNotificationsEnabled(false); 
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
          }
        }
      } else {
        toast({ title: "Bildirimler Desteklenmiyor", description: "Tarayıcınız bildirimleri desteklemiyor.", variant: "destructive" });
        setNotificationsEnabled(false);
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
      }
    } else {
      toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız." });
    }
  };

  const handleLocationServicesToggle = async (checked: boolean) => {
    // playClickSound(); // Sound will be played by the Button component itself
    setLocationServicesEnabled(checked);
    localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(checked));

    if (checked) {
        if (navigator.geolocation) {
            if (locationPermission === 'granted') {
                toast({ title: "Konum Servisleri Etkin", description: "Mevcut konumunuz kullanılabilir." });
            } else if (locationPermission === 'denied') {
                toast({
                    title: "Konum İzni Reddedilmiş",
                    description: "Tarayıcı ayarlarından konum iznini vermeniz gerekiyor.",
                    variant: "destructive",
                });
                setLocationServicesEnabled(false);
                localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
            } else { 
                navigator.geolocation.getCurrentPosition(
                    () => {
                        setLocationPermission('granted');
                        localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
                        toast({ title: "Konum İzni Verildi", description: "Mevcut konumunuz kullanılabilir." });
                    },
                    (error) => {
                        setLocationPermission('denied');
                        localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
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
    // No need to call playClickSound() here as the Switch itself is not a Button
    // However, the user might expect a sound here too. 
    // For now, we only make <Button> components play sound.
    setUiSoundEnabled(checked);
    localStorage.setItem(UI_SOUND_ENABLED_KEY, JSON.stringify(checked));
    if (checked) {
      playClickSound(); // Play sound when toggling on
      toast({ title: "UI Tıklama Sesi Etkin" });
    } else {
      toast({ title: "UI Tıklama Sesi Devre Dışı" });
    }
  };

  const handleResetSettings = () => {
    // playClickSound(); // Sound will be played by the Button component itself
    setTheme('light'); 
    localStorage.removeItem('havadurumux-theme');

    setNotificationsEnabled(false);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission); 
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Notification.permission);
    }

    setLocationServicesEnabled(false);
    localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
            setLocationPermission(status.state); 
            localStorage.setItem(LOCATION_PERMISSION_KEY, status.state);
        });
    } else {
        setLocationPermission(null);
        localStorage.removeItem(LOCATION_PERMISSION_KEY);
    }
    
    setUiSoundEnabled(false);
    localStorage.setItem(UI_SOUND_ENABLED_KEY, JSON.stringify(false));

    toast({ title: "Tüm Ayarlar Sıfırlandı", description: "Uygulama ayarları varsayılan değerlere döndürüldü." });
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
            <ThemeToggle /> {/* This is a Button, will play sound */}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
           <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Bildirimler ve Konum</CardTitle>
          </div>
          <CardDescription>Uygulama bildirimlerini ve konum servislerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="notifications-switch" className="text-base font-medium">Hava Durumu Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">Favori konumlarınız için önemli hava durumu uyarıları alın.</p>
            </div>
            <Switch
              id="notifications-switch"
              checked={notificationsEnabled && notificationPermission === 'granted'}
              onCheckedChange={handleNotificationToggle}
              disabled={notificationPermission === 'denied'}
            />
          </div>
          {notificationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı bildirimlerine izin vermediniz. Ayarlardan değiştirmediğiniz sürece bildirim alamazsınız.</p>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
             <div>
              <Label htmlFor="location-switch" className="text-base font-medium">Konum Servisleri</Label>
              <p className="text-sm text-muted-foreground">Mevcut konumunuza göre hava durumu bilgisi için.</p>
            </div>
            <Switch
              id="location-switch"
              checked={locationServicesEnabled && locationPermission === 'granted'}
              onCheckedChange={handleLocationServicesToggle}
              disabled={locationPermission === 'denied'}
            />
          </div>
           {locationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı konum iznini vermediniz. Ayarlardan değiştirmediğiniz sürece mevcut konumunuz kullanılamaz.</p>
            </div>
          )}
           {locationPermission === 'prompt' && locationServicesEnabled && (
            <div className="flex items-center gap-2 p-3 text-sm text-info-foreground bg-info/80 rounded-md">
              <InfoIcon className="w-5 h-5" />
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
              checked={uiSoundEnabled}
              onCheckedChange={handleUiSoundToggle} // This will also play sound when toggled ON.
            />
          </div>
          <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
            <h3 className="text-base font-medium mb-2 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-primary" />Ayarları Sıfırla</h3>
            <p className="text-sm text-muted-foreground mb-3">Tüm uygulama ayarlarını (tema, bildirimler, konum, ses) varsayılan değerlere döndürür.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto"> {/* Will play sound */}
                  <Trash2 className="mr-2 h-4 w-4" /> Tüm Ayarları Sıfırla
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem tüm HavaDurumuX ayarlarınızı (tema, bildirim tercihleri, konum izinleri ve diğer ayarlar)
                    sıfırlayacak ve geri alınamaz. Devam etmek istediğinizden emin misiniz?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel> {/* Will play sound */}
                  <AlertDialogAction onClick={handleResetSettings}>Sıfırla</AlertDialogAction> {/* Will play sound */}
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
