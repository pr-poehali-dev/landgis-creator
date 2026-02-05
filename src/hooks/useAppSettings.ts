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
      // Пробуем загрузить из localStorage для быстрого отображения
      const saved = localStorage.getItem(STORAGE_KEY);
      let localSettings: AppSettings | null = null;
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Проверяем, что логотип валидный (не тестовый)
          if (parsed.logo && parsed.logo.length > 100) {
            localSettings = { ...defaultSettings, ...parsed };
            setSettings(localSettings);
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }

      // ВСЕГДА проверяем API (особенно важно для мобильных, где localStorage ненадёжен)
      try {
        const response = await fetch(SETTINGS_API);
        if (response.ok) {
          const apiSettings = await response.json();
          
          // Фильтруем тестовые данные из API
          if (apiSettings.logo && apiSettings.logo.length < 100) {
            delete apiSettings.logo;
          }
          
          const merged = { ...defaultSettings, ...apiSettings };
          
          // Обновляем только если API вернул настройки с логотипом
          if (merged.logo && merged.logo.length > 100) {
            setSettings(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } else if (!localSettings) {
            // Если ни в API, ни в localStorage нет логотипа, используем дефолт
            setSettings(merged);
          }
        }
      } catch (apiError) {
        console.error('API fetch error, using localStorage:', apiError);
        // Если API недоступен, используем localStorage
        if (localSettings) {
          setSettings(localSettings);
        }
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
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