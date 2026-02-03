import { useState, useEffect } from 'react';
import { mapSettingsService } from '@/services/mapSettingsService';

export interface AppSettings {
  logo: string;
  title: string;
  subtitle: string;
  bgColor: string;
  buttonColor: string;
}

const defaultSettings: AppSettings = {
  logo: '',
  title: 'LandGis',
  subtitle: 'Картографическая CRM',
  bgColor: '#ffffff',
  buttonColor: '#3b82f6'
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await mapSettingsService.getSettings();
      
      const logo = allSettings.find(s => s.setting_key === 'app_logo')?.setting_value || '';
      const title = allSettings.find(s => s.setting_key === 'app_title')?.setting_value || 'LandGis';
      const subtitle = allSettings.find(s => s.setting_key === 'app_subtitle')?.setting_value || 'Картографическая CRM';
      const bgColor = allSettings.find(s => s.setting_key === 'app_bg_color')?.setting_value || '#ffffff';
      const buttonColor = allSettings.find(s => s.setting_key === 'app_button_color')?.setting_value || '#3b82f6';

      setSettings({
        logo,
        title,
        subtitle,
        bgColor,
        buttonColor
      });
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading };
};
