import { useState, useEffect } from 'react';

export interface InstitutionSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  timeZone: string;
  language: string;
  darkMode: boolean;
  fontSize: string;
  autoPrint?: boolean;
  // Branding
  logoDataUrl?: string; // base64 PNG or JPEG data URL
  location?: string;    // City, Country (for header contact block)
}

const defaultSettings: InstitutionSettings = {
  name: "École Privée Excellence",
  address: "123 Avenue Mohammed V, Casablanca, Maroc",
  phone: "+212 522 123 456",
  email: "contact@excellence.ma",
  timeZone: "Africa/Casablanca",
  language: "fr",
  darkMode: false,
  fontSize: "medium",
  autoPrint: true,
  logoDataUrl: "", // You can set this from Settings UI (base64 image)
  location: "Casablanca, Maroc",
};

export const useSettings = () => {
  const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettings>(() => {
    const saved = localStorage.getItem('institution-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateInstitutionSettings = (updates: Partial<InstitutionSettings>) => {
    const newSettings = { ...institutionSettings, ...updates };
    setInstitutionSettings(newSettings);
    localStorage.setItem('institution-settings', JSON.stringify(newSettings));
    try {
      window.dispatchEvent(new CustomEvent('institution-settings-changed', { detail: newSettings }));
    } catch {}
  };

  const resetToDefaults = () => {
    setInstitutionSettings(defaultSettings);
    localStorage.setItem('institution-settings', JSON.stringify(defaultSettings));
    try {
      window.dispatchEvent(new CustomEvent('institution-settings-changed', { detail: defaultSettings }));
    } catch {}
  };

  // Listen for settings updates (same-tab custom event and cross-tab storage event)
  useEffect(() => {
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<InstitutionSettings>;
      if (ce.detail) setInstitutionSettings(ce.detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'institution-settings' && e.newValue) {
        try {
          setInstitutionSettings({ ...defaultSettings, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener('institution-settings-changed', onCustom as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('institution-settings-changed', onCustom as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return {
    institutionSettings,
    updateInstitutionSettings,
    resetToDefaults
  };
};