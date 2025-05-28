
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const UI_SOUND_ENABLED_KEY = 'havadurumux-ui-sound-enabled';
const SOUND_URL = 'https://files.catbox.moe/42qpsz.mp4';

interface SoundContextType {
  playClickSound: () => void;
  isSoundGloballyEnabled: boolean;
  setGlobalSoundEnabled: (enabled: boolean) => void; // Added
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [uiSoundEnabledSetting, setUiSoundEnabledSetting] = useState(false);
  const [clickAudio, setClickAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Initialize audio element and load setting from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUiSoundEnabled = localStorage.getItem(UI_SOUND_ENABLED_KEY);
      setUiSoundEnabledSetting(savedUiSoundEnabled === 'true');

      try {
        const audio = new Audio(SOUND_URL);
        audio.preload = 'auto';
        setClickAudio(audio);
        setIsAudioInitialized(true);
      } catch (error) {
        console.warn("Global click audio element could not be initialized:", error);
      }

      // Listen for changes from other tabs/windows
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === UI_SOUND_ENABLED_KEY) {
          setUiSoundEnabledSetting(event.newValue === 'true');
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const playClickSound = useCallback(() => {
    if (uiSoundEnabledSetting && clickAudio && isAudioInitialized) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(error => {
        console.warn("Global click sound play failed (possibly due to autoplay restrictions):", error);
      });
    }
  }, [uiSoundEnabledSetting, clickAudio, isAudioInitialized]);

  const setGlobalSoundEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(UI_SOUND_ENABLED_KEY, JSON.stringify(enabled));
    setUiSoundEnabledSetting(enabled);
  }, [setUiSoundEnabledSetting]);

  return (
    <SoundContext.Provider value={{ playClickSound, isSoundGloballyEnabled: uiSoundEnabledSetting, setGlobalSoundEnabled }}>
      {children}
    </SoundContext.Provider>
  );
};
