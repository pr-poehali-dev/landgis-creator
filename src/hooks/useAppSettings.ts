import { useState, useEffect } from 'react';

export interface AppSettings {
  logo: string;
  title: string;
  subtitle: string;
  bgColor: string;
  buttonColor: string;
}

const defaultSettings: AppSettings = {
  logo: '',
  title: '3емБук',
  subtitle: 'Картографическая CRM',
  bgColor: '#1f1f1f',
  buttonColor: '#ff7c53'
};

const STORAGE_KEY = 'app_design_settings';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { settings, isLoading, saveSettings };
};