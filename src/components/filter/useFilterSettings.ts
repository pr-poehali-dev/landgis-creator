import { useState, useEffect } from 'react';
import { filterVisibilityService, FilterVisibilityConfig } from '@/services/filterVisibilityService';
import { FilterColumnSettings } from './types';
import { UserRole } from '@/types/userRoles';

const FILTER_CONFIG_URL = 'https://functions.poehali.dev/d55d58af-9be6-493a-a89d-45634d648637';

export const useFilterSettings = (
  isOpen: boolean,
  filters: Record<string, string[]>,
  onFiltersChange: (filters: Record<string, string[]>) => void,
  userRole: UserRole = 'admin',
  companyId?: number
) => {
  const [filterSettings, setFilterSettings] = useState<FilterColumnSettings[]>([]);
  const [visibilityConfig, setVisibilityConfig] = useState<FilterVisibilityConfig | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      let visConfig: FilterVisibilityConfig | null = null;
      try {
        visConfig = await filterVisibilityService.loadConfig();
        setVisibilityConfig(visConfig);
      } catch (e) {
        console.error('Error loading visibility config:', e);
      }

      const applyDefaults = (settings: FilterColumnSettings[]) => {
        const defaultFilters: Record<string, string[]> = {};
        settings.forEach((setting: FilterColumnSettings) => {
          if (setting.defaultValues && setting.defaultValues.length > 0) {
            defaultFilters[setting.id] = setting.defaultValues;
          }
        });
        if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
          onFiltersChange(defaultFilters);
        }
      };

      try {
        const response = await fetch(FILTER_CONFIG_URL);
        
        if (response.ok) {
          const data = await response.json();
          if (data.config && data.config.length > 0) {
            setFilterSettings(data.config);
            localStorage.setItem('filterSettings', JSON.stringify(data.config));
            applyDefaults(data.config);
            return;
          }
        }
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setFilterSettings(settings);
          applyDefaults(settings);
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setFilterSettings(settings);
          applyDefaults(settings);
        }
      }
    };
    
    loadSettings();
  }, [isOpen, userRole]);

  return { filterSettings, visibilityConfig };
};

export default useFilterSettings;