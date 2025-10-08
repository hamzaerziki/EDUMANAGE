import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

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
  logoDataUrl?: string;
  location?: string;
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
  logoDataUrl: "",
  location: "Casablanca, Maroc",
};

export const useSettings = () => {
  const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.request<InstitutionSettings>('/settings');
        setInstitutionSettings(response.data);
      } catch (error) {
        console.error("Error fetching institution settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const updateInstitutionSettings = async (updates: Partial<InstitutionSettings>) => {
    const newSettings = { ...institutionSettings, ...updates };
    setInstitutionSettings(newSettings);
    try {
      await apiClient.request<InstitutionSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });
      window.dispatchEvent(new CustomEvent('institution-settings-changed', { detail: newSettings }));
    } catch (error) {
      console.error("Error updating institution settings:", error);
    }
  };

  const resetToDefaults = () => {
    setInstitutionSettings(defaultSettings);
    updateInstitutionSettings(defaultSettings);
  };

  useEffect(() => {
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<InstitutionSettings>;
      if (ce.detail) setInstitutionSettings(ce.detail);
    };
    window.addEventListener('institution-settings-changed', onCustom as EventListener);
    return () => {
      window.removeEventListener('institution-settings-changed', onCustom as EventListener);
    };
  }, []);

  return {
    institutionSettings,
    updateInstitutionSettings,
    resetToDefaults
  };
};