
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
import { Brush, Bell, Compass, AlertTriangle, InfoIcon, Speaker, RotateCcw, Trash2, Send } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import { useSound } from '@/contexts/SoundContext';

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';

// This is your VAPID public key - Ensure this is correct
const VAPID_PUBLIC_KEY = 'BEOgt6ovxyEDuHK9UUo-OOjk4aaQlJGesgDmPTCJg5keyaEg8LwZHahPNLLDNk36jD5G4FDSGYG1Nq92f5OYV58';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export default function AyarlarPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { playClickSound, setGlobalSoundEnabled, isSoundGloballyEnabled } = useSound();

  const [notificationsEnabledSetting, setNotificationsEnabledSetting] = useState(false);
  const [currentNotificationPermission, setCurrentNotificationPermission] = useState<NotificationPermission | null>(null);

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [currentLocationPermission, setCurrentLocationPermission] = useState<PermissionState | null>(null);
  
  const [isSWRegistered, setIsSWRegistered] = useState(false);

  const [uiSoundSwitchState, setUiSoundSwitchState] = useState(isSoundGloballyEnabled);
  useEffect(() => {
    setUiSoundSwitchState(isSoundGloballyEnabled);
  }, [isSoundGloballyEnabled]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
      setNotificationsEnabledSetting(savedNotificationsEnabled === 'true');
      
      if (typeof Notification !== 'undefined') {
        setCurrentNotificationPermission(Notification.permission);
      } else {
        console.warn("Tarayıcı Notification API'sini desteklemiyor.");
      }

      const savedLocationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY);
      setLocationServicesEnabled(savedLocationServicesEnabled === 'true');
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
          setCurrentLocationPermission(status.state);
          status.onchange = () => setCurrentLocationPermission(status.state);
        });
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          console.log('Initial SW registration check:', registration);
          setIsSWRegistered(!!registration);
        });
      }
    }
  }, []);

  const registerServiceWorkerAndSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      toast({ title: "Push Bildirimleri Desteklenmiyor", description: "Tarayıcınız Service Worker veya Push API'sini desteklemiyor.", variant: "destructive" });
      return { swRegistered: false, pushSubscribed: false };
    }

    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      setIsSWRegistered(true);
      console.log('Service Worker başarıyla kaydedildi.', registration);
      
      try {
        console.log('Attempting push subscription...');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('Push aboneliği başarıyla oluşturuldu:', JSON.stringify(subscription));
        toast({ title: "Push Aboneliği Başarılı", description: "Bildirimler için abone olundu." });
        return { swRegistered: true, pushSubscribed: true };
      } catch (subError: any) {
        console.error('Push aboneliği oluşturulurken hata:', subError);
        let subErrorMessage = subError.message || 'Bilinmeyen abonelik hatası.';
        if (subError.name === 'NotAllowedError') {
            subErrorMessage = "Push abonelik izni verilmedi veya reddedildi.";
        } else if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes("PLACEHOLDER")) {
            subErrorMessage = "Push aboneliği için VAPID public key eksik veya hatalı. Lütfen geliştirici ile iletişime geçin.";
        }
        toast({ title: "Push Aboneliği Başarısız", description: `Abonelik hatası: ${subErrorMessage}`, variant: "destructive", duration: 7000 });
        return { swRegistered: true, pushSubscribed: false }; // SW registered, but push failed
      }
    } catch (error: any) {
      console.error('Service Worker kaydedilirken hata:', error);
      toast({ title: "Service Worker Kayıt Hatası", description: `Bir hata oluştu: ${error.message || 'Bilinmeyen SW kayıt hatası.'}`, variant: "destructive" });
      setIsSWRegistered(false);
      return { swRegistered: false, pushSubscribed: false };
    }
  };


  const handleNotificationToggle = async (checked: boolean) => {
    playClickSound();
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(checked));
    setNotificationsEnabledSetting(checked); // Set user's direct intent

    if (checked) {
      if (typeof Notification === 'undefined') {
         toast({ title: "Bildirimler Desteklenmiyor", description: "Tarayıcınız bildirimleri desteklemiyor.", variant: "destructive" });
         setNotificationsEnabledSetting(false);
         localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
         return;
      }

      let permission = currentNotificationPermission || Notification.permission; // Use state or direct check
      if (permission === 'default') {
        console.log('Requesting notification permission...');
        permission = await Notification.requestPermission();
        setCurrentNotificationPermission(permission); 
        console.log('Notification permission result:', permission);
      }
      

      if (permission === 'granted') {
        const { swRegistered } = await registerServiceWorkerAndSubscribe();
        if (swRegistered) {
          toast({ title: "Bildirim Sistemi Etkin", description: "Tarayıcı bildirimleri Service Worker üzerinden yönetilecektir." });
        } else {
          // SW registration failed, revert the main toggle
          setNotificationsEnabledSetting(false);
          localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
          toast({ title: "Bildirimler Etkinleştirilemedi", description: "Service Worker kaydı yapılamadı.", variant: "destructive" });
        }
      } else if (permission === 'denied') {
        toast({
          title: "Bildirim İzni Reddedilmiş",
          description: "Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.",
          variant: "destructive",
        });
        setNotificationsEnabledSetting(false);
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
      } else { // 'default' after request but not granted
         toast({
            title: "Bildirim İzni Gerekli",
            description: "Bildirimleri almak için izin vermelisiniz.",
            variant: "destructive",
          });
        setNotificationsEnabledSetting(false);
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
      }
    } else {
      // User is turning notifications OFF
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.pushManager.getSubscription().then(subscription => {
                if (subscription) {
                    subscription.unsubscribe().then(successful => {
                        if (successful) console.log("Push aboneliği başarıyla kaldırıldı.");
                        else console.error("Push aboneliği kaldırılamadı.");
                    }).catch(e => console.error("Push aboneliği kaldırılırken hata:", e));
                }
            });
            registration.unregister().then(unregistered => {
              if (unregistered) {
                console.log('Service Worker kaydı kaldırıldı.');
                setIsSWRegistered(false); // Explicitly set here
                toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız. Service Worker kaydı kaldırıldı." });
              } else {
                toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız." });
              }
            }).catch(err => {
               console.error('Service Worker kaydı kaldırılırken hata:', err);
               toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız (SW kaldırma hatası)." });
            });
          } else {
             toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız." });
             setIsSWRegistered(false); // No registration found, ensure state reflects this
          }
        });
      } else {
         toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız." });
      }
    }
  };

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

    // Turn off notifications and unregister SW
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
    setNotificationsEnabledSetting(false);
    if (typeof Notification !== 'undefined') {
      setCurrentNotificationPermission(Notification.permission); // Re-check after potential unregister
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.pushManager.getSubscription().then(sub => sub && sub.unsubscribe());
            registration.unregister().then(() => {
                console.log('SW unregister successful during reset.');
                setIsSWRegistered(false);
            });
          } else {
             setIsSWRegistered(false);
          }
        });
    }


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

    toast({ title: "Tüm Ayarlar Sıfırlandı", description: "Uygulama ayarları varsayılan değerlere döndürüldü." });
  };

  const sendTestNotification = async () => {
    playClickSound();
    console.log("sendTestNotification: Attempting to send test notification.");
    console.log("sendTestNotification: isSWRegistered:", isSWRegistered, "currentNotificationPermission:", currentNotificationPermission);

    if (!('serviceWorker' in navigator)) {
      toast({ title: "Service Worker Desteklenmiyor", description: "Tarayıcınız Service Worker API'sini desteklemiyor.", variant: "destructive" });
      return;
    }
    if (!isSWRegistered) {
      toast({
        title: "Service Worker Kayıtlı Değil",
        description: "Test bildirimi için Service Worker'ın kayıtlı olması gerekir. Lütfen bildirim ayarını açıp, tarayıcı iznini verip tekrar deneyin.",
        variant: "destructive",
      });
      return;
    }

    if (currentNotificationPermission !== 'granted') {
      toast({
        title: "Bildirim İzni Gerekli",
        description: "Test bildirimi göndermek için tarayıcı bildirim izni verilmiş olmalı.",
        variant: "destructive",
      });
      return;
    }

    console.log("sendTestNotification: All checks passed, proceeding to show notification via SW.");
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("sendTestNotification: Service Worker is ready.", registration);

      if (!registration.active) {
        console.warn("sendTestNotification: Service Worker is ready but not active. Notification might not show immediately.");
        toast({ title: "SW Aktif Değil", description: "Service Worker hazır ama henüz aktif değil. Birkaç saniye sonra tekrar deneyin veya sayfayı yenileyin.", variant: "default" });
        // return; // Optionally return here or let it try anyway
      }
      
      await registration.showNotification("Test Bildirimi Başlığı (SW)", {
        body: "Bu bir Service Worker test bildirimidir. Eğer bunu görüyorsanız, SW bildirimleri çalışıyor!",
        icon: '/logo.png', 
        badge: '/logo_badge.png', 
        data: { url: '/bildirimler' } 
      });
      console.log("sendTestNotification: registration.showNotification call completed.");
      toast({ title: "Test Bildirimi Gönderildi", description: "Service Worker üzerinden bir bildirim görmelisiniz." });
    } catch (error: any) {
      console.error("SW Test bildirimi oluşturulurken hata:", error);
      let errorMessage = `Bir hata oluştu: ${error.message}`;
      if (error.name === 'TypeError' && error.message.includes('Illegal constructor')) {
        errorMessage = "Bildirim oluşturulamadı. Tarayıcınız aktif bir Service Worker üzerinden bildirim bekliyor olabilir. Lütfen tarayıcı ayarlarından bu site için eski Service Worker kayıtlarını temizlemeyi deneyin veya bildirim ayarını kapatıp açın.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Bildirim izni verilmedi veya reddedildi (Service Worker seviyesinde).";
      } else if (error.name === 'InvalidStateError') {
         errorMessage = `Bildirim gösterme hatası (InvalidStateError): ${error.message}. Service Worker aktif olmayabilir veya push aboneliği ile ilgili bir sorun olabilir.`;
      }
      toast({
        title: "SW Test Bildirimi Hatası",
        description: errorMessage,
        variant: "destructive",
      });
    }
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
            <Bell className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Bildirimler ve Konum</CardTitle>
          </div>
          <CardDescription>Uygulama bildirimlerini ve konum servislerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="notifications-switch" className="text-base font-medium">Hava Durumu Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">Favori konumlarınız için önemli hava durumu uyarıları alın (Service Worker ile).</p>
            </div>
            <Switch
              id="notifications-switch"
              checked={notificationsEnabledSetting && currentNotificationPermission === 'granted'}
              onCheckedChange={handleNotificationToggle}
              disabled={currentNotificationPermission === 'denied'}
            />
          </div>
          {currentNotificationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı bildirimlerine izin vermediniz. Ayarlardan değiştirmediğiniz sürece bildirim alamazsınız.</p>
            </div>
          )}
           {notificationsEnabledSetting && currentNotificationPermission === 'prompt' && ( 
            <div className="flex items-center gap-2 p-3 text-sm text-info-foreground bg-info/80 rounded-md">
              <InfoIcon className="w-5 h-5" />
              <p>Tarayıcınız bildirim izni isteyecektir. Lütfen izin verin.</p>
            </div>
           )}
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
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı konum iznini vermediniz. Ayarlardan değiştirmediğiniz sürece mevcut konumunuz kullanılamaz.</p>
            </div>
          )}
           {locationServicesEnabled && currentLocationPermission === 'prompt' && ( 
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
              checked={uiSoundSwitchState} 
              onCheckedChange={handleUiSoundToggle}
            />
          </div>

          <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
            <h3 className="text-base font-medium mb-2 flex items-center gap-2"><Send className="w-5 h-5 text-primary" />Test Bildirimi</h3>
            <p className="text-sm text-muted-foreground mb-3">Service Worker üzerinden tarayıcı bildirimlerinin düzgün çalışıp çalışmadığını test etmek için bir bildirim gönderin.</p>
            <Button onClick={sendTestNotification} variant="outline" className="w-full sm:w-auto" disabled={!isSWRegistered || currentNotificationPermission !== 'granted'}>
              Test Bildirimi Gönder
            </Button>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg shadow-sm">
            <h3 className="text-base font-medium mb-2 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-primary" />Ayarları Sıfırla</h3>
            <p className="text-sm text-muted-foreground mb-3">Tüm uygulama ayarlarını (tema, bildirimler, konum, ses) varsayılan değerlere döndürür.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
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
            Bildirimler için tarayıcıda Service Worker kaydı yönetilmektedir. VAPID anahtarı, push aboneliği için gereklidir; gerçek bir push sunucusu entegrasyonu için bu anahtarın sunucu tarafında da kullanılması gerekir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
    

