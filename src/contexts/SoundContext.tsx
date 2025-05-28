
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const UI_SOUND_ENABLED_KEY = 'havadurumux-ui-sound-enabled';
const SOUND_URL = 'https://files.catbox.moe/42qpsz.mp4';

interface SoundContextType {
  playClickSound: () => void;
  isSoundGloballyEnabled: boolean;
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

  // Initialize audio element and check settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUiSoundEnabled = localStorage.getItem(UI_SOUND_ENABLED_KEY);
      setUiSoundEnabledSetting(savedUiSoundEnabled === 'true');

      try {
        const audio = new Audio(SOUND_URL);
        audio.preload = 'auto'; // Attempt to preload
        setClickAudio(audio);
        setIsAudioInitialized(true);
      } catch (error) {
        console.warn("Global click audio element could not be initialized:", error);
      }
    }
  }, []);

  // Listen for changes to the sound setting in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === UI_SOUND_ENABLED_KEY) {
        setUiSoundEnabledSetting(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Set initial value again in case it changed between initial load and event listener attachment
    const currentSetting = localStorage.getItem(UI_SOUND_ENABLED_KEY);
    setUiSoundEnabledSetting(currentSetting === 'true');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const playClickSound = useCallback(() => {
    if (uiSoundEnabledSetting && clickAudio && isAudioInitialized) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(error => {
        // Autoplay restrictions might require a user interaction to "unlock" audio.
        // This first play attempt might fail silently or log a warning.
        // Subsequent plays after user interaction should work.
        console.warn("Global click sound play failed (possibly due to autoplay restrictions):", error);
      });
    }
  }, [uiSoundEnabledSetting, clickAudio, isAudioInitialized]);

  return (
    <SoundContext.Provider value={{ playClickSound, isSoundGloballyEnabled: uiSoundEnabledSetting }}>
      {children}
    </SoundContext.Provider>
  );
};
