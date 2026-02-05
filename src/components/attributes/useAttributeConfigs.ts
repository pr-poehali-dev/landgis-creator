import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { toast } from 'sonner';
import func2url from '../../../backend/func2url.json';

export const useAttributeConfigs = (attributes?: Record<string, any>) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, [attributes]);

  const loadConfigs = async () => {
    if (!attributes) return;
    
    setIsLoading(true);
    
    try {
      // Загружаем настройки из БД
      const response = await fetch(func2url['attribute-configs']);
      if (!response.ok) throw new Error('Failed to load configs from DB');
      
      const savedConfigs: Record<string, DisplayConfig> = await response.json();
      
      // Автоматические миграции старых форматов
      applyAutoMigrations(savedConfigs);
      
      const savedConfigsArray = Object.values(savedConfigs);
      
      if (savedConfigsArray.length > 0) {
        // Добавляем новые атрибуты, которых нет в БД
        const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
        const existingConfigKeys = new Set(savedConfigsArray.map(c => c.configKey));
        const existingOriginalKeys = new Set(savedConfigsArray.map(c => c.originalKey).filter(Boolean));
        
        const newAttributeKeys = attributeKeys.filter(key => 
          !existingConfigKeys.has(key) && !existingOriginalKeys.has(key)
        );
        
        const newConfigs: DisplayConfig[] = newAttributeKeys.map((key, index) => 
          createDefaultConfig(key, savedConfigsArray.length + index)
        );
        
        const mergedConfigs = [...savedConfigsArray, ...newConfigs];
        setConfigs(mergedConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
      } else {
        // Если в БД пусто - создаём дефолтные настройки
        const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
        const newConfigs: DisplayConfig[] = attributeKeys.map((key, index) => 
          createDefaultConfig(key, index)
        );
        
        setConfigs(newConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
        
        // Сохраняем дефолтные настройки в БД
        await saveConfigsToDB(newConfigs);
      }
    } catch (error) {
      console.error('Error loading configs from DB:', error);
      toast.error('Не удалось загрузить настройки атрибутов');
    } finally {
      setIsLoading(false);
    }
  };

  const applyAutoMigrations = (savedConfigs: Record<string, DisplayConfig>) => {
    // Автоматическое обновление типа ekspos на money
    if (savedConfigs['ekspos'] && savedConfigs['ekspos'].formatType !== 'money') {
      savedConfigs['ekspos'].formatType = 'money';
      savedConfigs['ekspos'].displayName = 'Стоимость';
    }
    
    // Автоматическое обновление типа ID на text
    if (savedConfigs['ID'] && savedConfigs['ID'].formatType !== 'text') {
      savedConfigs['ID'].formatType = 'text';
    }
    
    // Автоматическое обновление типа oks на toggle
    if (savedConfigs['oks'] && savedConfigs['oks'].formatType !== 'toggle') {
      savedConfigs['oks'].formatType = 'toggle';
      savedConfigs['oks'].displayName = 'Наличие ОКС';
      savedConfigs['oks'].formatOptions = {
        trueLabel: 'Да',
        falseLabel: 'Нет'
      };
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
    }
    
    // Исправляем conditionalDisplay для lgota: mpt → status_mpt
    if (savedConfigs['lgota']?.conditionalDisplay?.dependsOn === 'mpt') {
      savedConfigs['lgota'].conditionalDisplay.dependsOn = 'status_mpt';
    }
  };

  const createDefaultConfig = (key: string, displayOrder: number): DisplayConfig => {
    const defaultConfig: DisplayConfig = {
      id: Date.now() + displayOrder,
      configType: 'attribute',
      configKey: key,
      originalKey: key,
      displayName: key,
      displayOrder,
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
  };

  const saveConfigsToDB = async (configsArray: DisplayConfig[]) => {
    const configsMap: Record<string, DisplayConfig> = {};
    configsArray.forEach(c => {
      configsMap[c.configKey] = c;
    });
    
    const response = await fetch(func2url['attribute-configs'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: configsMap })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save configs to DB');
    }
  };

  const cleanupObsoleteAttributes = async () => {
    if (!attributes) return;
    
    const actualKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
    
    let hasChanges = false;
    const cleanedConfigs = configs.filter(cfg => {
      const isActual = actualKeys.includes(cfg.originalKey || cfg.configKey);
      if (!isActual) hasChanges = true;
      return isActual;
    });
    
    if (hasChanges) {
      setConfigs(cleanedConfigs);
      await saveConfigsToDB(cleanedConfigs);
      toast.success('Удалены атрибуты, которых больше нет в базе данных');
    } else {
      toast.info('Все атрибуты актуальны');
    }
  };

  const saveConfigs = async (onAttributesUpdate?: (attributes: Record<string, any>) => void) => {
    try {
      await saveConfigsToDB(configs);
      
      // Переименование ключей в БД (если есть)
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
      
      toast.success('Настройки сохранены для всех пользователей');
      
      if (renamedKeys.length > 0 && onAttributesUpdate) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error('Не удалось сохранить настройки');
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
    isLoading,
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
