import { useState, useEffect } from 'react';
import func2url from '../../backend/func2url.json';

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
  bgColor: '#1c1e22',
  buttonColor: '#f97316'
};

const STORAGE_KEY = 'app_design_settings';
const SETTINGS_API = func2url.settings;

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Загружаем из API
      const response = await fetch(SETTINGS_API);
      if (response.ok) {
        const apiSettings = await response.json();
        const merged = { ...defaultSettings, ...apiSettings };
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } else {
        // Если API недоступен, пробуем localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
        }
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
      // При ошибке пробуем localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Сохраняем в localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Сохраняем в БД через API
    try {
      await fetch(SETTINGS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.error('Error saving settings to API:', error);
    }
  };

  return { settings, isLoading, saveSettings };
};