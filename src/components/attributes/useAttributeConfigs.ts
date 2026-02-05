import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { toast } from 'sonner';
import func2url from '../../../backend/func2url.json';

// Возвращаемся к локальному ключу - у админа там правильный порядок
const GLOBAL_STORAGE_KEY = 'attributeConfigs';

// Правильный порядок атрибутов по умолчанию
const DEFAULT_ATTRIBUTE_ORDER = [
  'region', 'segment', 'uchastok', 'ID', 'ekspos', 'ird', 'oks', 'status_mpt', 
  'lgota', 'date', 'prava', 'pravoobl', 'zareg_ogran', 'broker', 'contacts', 
  'soinvest', 'str_soor', 'grad_param', 'istochnik', 'type_predl', 
  'status_publ', 'insight'
];

export const useAttributeConfigs = (attributes?: Record<string, any>) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);

  useEffect(() => {
    loadConfigs();
  }, [attributes]);

  const cleanupObsoleteAttributes = () => {
    if (!attributes) return;
    
    const savedConfigs = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!savedConfigs) return;
    
    const savedConfigsMap = JSON.parse(savedConfigs);
    const actualKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
    
    let hasChanges = false;
    const cleanedConfigs: Record<string, DisplayConfig> = {};
    
    Object.entries(savedConfigsMap).forEach(([key, config]) => {
      const cfg = config as DisplayConfig;
      if (actualKeys.includes(cfg.originalKey || cfg.configKey)) {
        cleanedConfigs[key] = cfg;
      } else {
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(cleanedConfigs));
      loadConfigs();
      toast.success('Удалены атрибуты, которых больше нет в базе данных');
    } else {
      toast.info('Все атрибуты актуальны');
    }
  };

  const loadConfigs = () => {
    if (!attributes) return;
    
    const saved = localStorage.getItem(GLOBAL_STORAGE_KEY);
    let savedConfigs: Record<string, DisplayConfig> = {};
    
    if (saved) {
      savedConfigs = JSON.parse(saved);
      
      // Автоматическое обновление типа ekspos на money
      if (savedConfigs['ekspos'] && savedConfigs['ekspos'].formatType !== 'money') {
        savedConfigs['ekspos'].formatType = 'money';
        savedConfigs['ekspos'].displayName = 'Стоимость';
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(savedConfigs));
      }
      
      // Автоматическое обновление типа ID на text (для сохранения ведущих нулей)
      if (savedConfigs['ID'] && savedConfigs['ID'].formatType !== 'text') {
        savedConfigs['ID'].formatType = 'text';
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(savedConfigs));
      }
      
      // Автоматическое обновление типа oks на toggle
      if (savedConfigs['oks'] && savedConfigs['oks'].formatType !== 'toggle') {
        savedConfigs['oks'].formatType = 'toggle';
        savedConfigs['oks'].displayName = 'Наличие ОКС';
        savedConfigs['oks'].formatOptions = {
          trueLabel: 'Да',
          falseLabel: 'Нет'
        };
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(savedConfigs));
      }
      
      // Автоматическое добавление атрибута "Статус МПТ" если его нет
      if (!savedConfigs['status_mpt']) {
        const maxOrder = Math.max(...Object.values(savedConfigs).map((c: any) => c.displayOrder || 0), 0);
        savedConfigs['status_mpt'] = {
          id: Date.now() + 9999,
          configType: 'attribute',
          configKey: 'status_mpt',
          originalKey: 'status_mpt',
          displayName: 'Статус МПТ',
          displayOrder: maxOrder + 1,
          visibleRoles: ['admin'],
          enabled: true,
          settings: {},
          formatType: 'toggle',
          formatOptions: {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          }
        };
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(savedConfigs));
      }
      
      // Исправляем conditionalDisplay для lgota: mpt → status_mpt
      if (savedConfigs['lgota']?.conditionalDisplay?.dependsOn === 'mpt') {
        savedConfigs['lgota'].conditionalDisplay.dependsOn = 'status_mpt';
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(savedConfigs));
      }
    }
    
    const savedConfigsArray = Object.values(savedConfigs);
    
    if (savedConfigsArray.length > 0) {
      const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
      const existingConfigKeys = new Set(savedConfigsArray.map(c => c.configKey));
      const existingOriginalKeys = new Set(savedConfigsArray.map(c => c.originalKey).filter(Boolean));
      
      const newAttributeKeys = attributeKeys.filter(key => 
        !existingConfigKeys.has(key) && !existingOriginalKeys.has(key)
      );
      
      const newConfigs: DisplayConfig[] = newAttributeKeys.map((key, index) => {
        const defaultConfig: DisplayConfig = {
          id: Date.now() + index,
          configType: 'attribute',
          configKey: key,
          originalKey: key,
          displayName: key,
          displayOrder: savedConfigsArray.length + index,
          visibleRoles: ['admin'],
          enabled: true,
          settings: {},
          formatType: 'text'
        };
        
        if (key === 'region') {
          defaultConfig.formatType = 'select';
          defaultConfig.displayName = 'Регион';
          defaultConfig.formatOptions = {
            options: ['Москва и МО', 'СПб и ЛО', 'Другие регионы']
          };
        }
        
        if (key === 'ekspos') {
          defaultConfig.formatType = 'money';
          defaultConfig.displayName = 'Стоимость';
        }
        
        return defaultConfig;
      });
      
      const mergedConfigs = [...savedConfigsArray, ...newConfigs];
      setConfigs(mergedConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
    } else {
      const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
      
      // Сортируем ключи по DEFAULT_ATTRIBUTE_ORDER
      const sortedKeys = attributeKeys.sort((a, b) => {
        const aIndex = DEFAULT_ATTRIBUTE_ORDER.indexOf(a);
        const bIndex = DEFAULT_ATTRIBUTE_ORDER.indexOf(b);
        
        // Если оба ключа в списке - сортируем по индексу
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // Если только один в списке - он идет первым
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // Если оба не в списке - по алфавиту
        return a.localeCompare(b);
      });
      
      const newConfigs: DisplayConfig[] = sortedKeys.map((key, index) => {
        const defaultConfig: DisplayConfig = {
          id: Date.now() + index,
          configType: 'attribute',
          configKey: key,
          originalKey: key,
          displayName: key,
          displayOrder: index,
          visibleRoles: ['admin'],
          enabled: true,
          settings: {},
          formatType: 'text'
        };
        
        if (key === 'region') {
          defaultConfig.formatType = 'select';
          defaultConfig.displayName = 'Регион';
          defaultConfig.formatOptions = {
            options: ['Москва и МО', 'СПб и ЛО', 'Другие регионы']
          };
        }
        
        if (key === 'ekspos') {
          defaultConfig.formatType = 'money';
          defaultConfig.displayName = 'Стоимость';
        }
        
        if (key === 'oks') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.displayName = 'Наличие ОКС';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'status_mpt') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.displayName = 'Статус МПТ';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'ID') {
          defaultConfig.formatType = 'text';
          defaultConfig.displayName = 'ID';
        }
        
        return defaultConfig;
      });
      
      setConfigs(newConfigs);
    }
  };

  const saveConfigs = async (onAttributesUpdate?: (attributes: Record<string, any>) => void) => {
    const configsMap: Record<string, DisplayConfig> = {};
    configs.forEach(c => {
      configsMap[c.configKey] = c;
    });
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(configsMap));
    
    const renamedKeys = configs.filter(c => c.originalKey && c.originalKey !== c.configKey);
    
    if (renamedKeys.length > 0) {
      for (const config of renamedKeys) {
        try {
          const response = await fetch(`${func2url['update-attributes']}?action=rename_key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oldKey: config.originalKey,
              newKey: config.configKey
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to rename ${config.originalKey} to ${config.configKey}`);
          }
          
          const result = await response.json();
          toast.success(`Ключ "${config.originalKey}" переименован в "${config.configKey}" (${result.affectedRows} объектов)`);
          
          config.originalKey = config.configKey;
        } catch (error) {
          console.error('Error renaming key:', error);
          toast.error(`Не удалось переименовать ключ "${config.originalKey}"`);
        }
      }
    }
    
    toast.success('Настройки сохранены для всех объектов');
    
    if (renamedKeys.length > 0 && onAttributesUpdate) {
      window.location.reload();
    }
  };

  const handleConfigChange = (index: number, field: keyof DisplayConfig, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
  };

  const moveConfig = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === configs.length - 1)
    ) {
      return;
    }

    const newConfigs = [...configs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newConfigs[index], newConfigs[targetIndex]] = [newConfigs[targetIndex], newConfigs[index]];
    
    newConfigs.forEach((config, idx) => {
      config.displayOrder = idx;
    });
    
    setConfigs(newConfigs);
  };

  const toggleConfigEnabled = (index: number) => {
    const newConfigs = [...configs];
    newConfigs[index] = { 
      ...newConfigs[index], 
      enabled: !newConfigs[index].enabled 
    };
    setConfigs(newConfigs);
  };

  const deleteConfig = (index: number) => {
    const newConfigs = configs.filter((_, i) => i !== index);
    newConfigs.forEach((config, idx) => {
      config.displayOrder = idx;
    });
    setConfigs(newConfigs);
  };

  const addConfig = (config: DisplayConfig) => {
    const newConfigs = [...configs, { ...config, displayOrder: configs.length }];
    setConfigs(newConfigs);
  };

  return {
    configs,
    loadConfigs,
    saveConfigs,
    cleanupObsoleteAttributes,
    handleConfigChange,
    moveConfig,
    toggleConfigEnabled,
    deleteConfig,
    addConfig
  };
};