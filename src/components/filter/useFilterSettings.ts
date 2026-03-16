import { useState, useEffect } from 'react';
import { filterVisibilityService } from '@/services/filterVisibilityService';
import { FilterColumnSettings } from './types';

const FILTER_CONFIG_URL = 'https://functions.poehali.dev/d55d58af-9be6-493a-a89d-45634d648637';

export const useFilterSettings = (
  isOpen: boolean,
  filters: Record<string, string[]>,
  onFiltersChange: (filters: Record<string, string[]>) => void
) => {
  const [filterSettings, setFilterSettings] = useState<FilterColumnSettings[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(FILTER_CONFIG_URL);
        
        if (response.ok) {
          const data = await response.json();
          if (data.config && data.config.length > 0) {
            console.log('📱 Настройки загружены с сервера:', data.config);
            setFilterSettings(data.config);
            
            localStorage.setItem('filterSettings', JSON.stringify(data.config));
            
            const defaultFilters: Record<string, string[]> = {};
            data.config.forEach((setting: FilterColumnSettings) => {
              if (setting.defaultValues && setting.defaultValues.length > 0) {
                defaultFilters[setting.id] = setting.defaultValues;
              }
            });
            
            if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
              console.log('🔄 Применяем дефолтные фильтры:', defaultFilters);
              onFiltersChange(defaultFilters);
            }
            return;
          }
        }
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          console.log('📱 Настройки загружены из localStorage:', settings);
          setFilterSettings(settings);
          
          const defaultFilters: Record<string, string[]> = {};
          settings.forEach((setting: FilterColumnSettings) => {
            if (setting.defaultValues.length > 0) {
              defaultFilters[setting.id] = setting.defaultValues;
            }
          });
          
          if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
            onFiltersChange(defaultFilters);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
        
        const saved = localStorage.getItem('filterSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setFilterSettings(settings);

          const defaultFilters: Record<string, string[]> = {};
          settings.forEach((setting: FilterColumnSettings) => {
            if (setting.defaultValues && setting.defaultValues.length > 0) {
              defaultFilters[setting.id] = setting.defaultValues;
            }
          });

          if (Object.keys(defaultFilters).length > 0 && Object.keys(filters).length === 0) {
            onFiltersChange(defaultFilters);
          }
        }
      }
    };
    
    loadSettings();
    filterVisibilityService.loadConfig();
  }, [isOpen]);

  return filterSettings;
};

export default useFilterSettings;