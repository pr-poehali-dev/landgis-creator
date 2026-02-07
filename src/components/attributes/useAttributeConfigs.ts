import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { toast } from 'sonner';
import func2url from '../../../backend/func2url.json';

// Возвращаемся к локальному ключу - у админа там правильный порядок
const GLOBAL_STORAGE_KEY = 'attributeConfigs';
const DELETED_ATTRIBUTES_KEY = 'deletedAttributes';

// Правильный порядок атрибутов по умолчанию
const DEFAULT_ATTRIBUTE_ORDER = [
  'region', 'segment', 'uchastok', 'ID', 'ekspos', 'ird', 'oks', 'status_mpt', 
  'lgota', 'date', 'prava', 'pravoobl', 'zareg_ogran', 'broker', 'contacts', 
  'soinvest', 'str_soor', 'grad_param', 'istochnik', 'type_predl', 
  'status_publ', 'insight'
];

export const useAttributeConfigs = (attributes?: Record<string, any>) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [previousConfigKeys, setPreviousConfigKeys] = useState<Set<string>>(new Set());

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

  const loadConfigs = async () => {
    if (!attributes) return;
    
    // 1. Сначала пробуем загрузить с сервера (из БД)
    try {
      const { displayConfigService } = await import('@/services/displayConfigService');
      const serverConfigs = await displayConfigService.getConfigs();
      
      if (serverConfigs && serverConfigs.length > 0) {
        console.log('✅ Загружено конфигов с сервера:', serverConfigs.length);
        
        // Сохраняем в localStorage для кэша
        const configsMap: Record<string, DisplayConfig> = {};
        serverConfigs.forEach(config => {
          configsMap[config.configKey] = config;
        });
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(configsMap));
        
        setConfigs(serverConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
        setPreviousConfigKeys(new Set(serverConfigs.map(c => c.originalKey || c.configKey)));
        return;
      }
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить с сервера, используем localStorage:', error);
    }
    
    // 2. Fallback: загружаем из localStorage
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
      
      // Получаем список удалённых навсегда атрибутов
      const deletedAttributesStr = localStorage.getItem(DELETED_ATTRIBUTES_KEY);
      const deletedAttributes = deletedAttributesStr ? new Set(JSON.parse(deletedAttributesStr)) : new Set<string>();
      
      const newAttributeKeys = attributeKeys.filter(key => 
        !existingConfigKeys.has(key) && !existingOriginalKeys.has(key) && !deletedAttributes.has(key)
      );
      
      const displayNames: Record<string, string> = {
        'region': 'Регион',
        'segment': 'Сегмент',
        'uchastok': 'Земельный участок',
        'ID': 'ID',
        'ekspos': 'Стоимость',
        'ird': 'Наличие ИРД',
        'oks': 'Наличие ОКС',
        'status_mpt': 'Статус МПТ',
        'lgota': 'Льгота по налогу',
        'date': 'Срок реализации',
        'prava': 'Права',
        'pravoobl': 'Правообладатель',
        'zareg_ogran': 'Зарегистрированные ограничения',
        'broker': 'Брокер',
        'contacts': 'Контакты',
        'soinvest': 'Возможность соинвестирования',
        'str_soor': 'Строения и сооружения',
        'grad_param': 'Градостроительные параметры',
        'istochnik': 'Источник',
        'type_predl': 'Тип предложения',
        'status_publ': 'Статус публикации',
        'insight': 'Инсайт'
      };
      
      const newConfigs: DisplayConfig[] = newAttributeKeys.map((key, index) => {
        const defaultConfig: DisplayConfig = {
          id: Date.now() + index,
          configType: 'attribute',
          configKey: key,
          originalKey: key,
          displayName: displayNames[key] || key,
          displayOrder: savedConfigsArray.length + index,
          visibleRoles: ['admin'],
          enabled: true,
          settings: {},
          formatType: 'text'
        };
        
        if (key === 'region') {
          defaultConfig.formatType = 'select';
          defaultConfig.formatOptions = {
            options: ['Москва и МО', 'СПб и ЛО', 'Другие регионы']
          };
        }
        
        if (key === 'ekspos') {
          defaultConfig.formatType = 'money';
        }
        
        if (key === 'oks') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'status_mpt') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'ID') {
          defaultConfig.formatType = 'text';
        }
        
        return defaultConfig;
      });
      
      const mergedConfigs = [...savedConfigsArray, ...newConfigs];
      
      // Обновляем список ключей для отслеживания удалений
      setPreviousConfigKeys(new Set(mergedConfigs.map(c => c.originalKey || c.configKey)));
      
      setConfigs(mergedConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
    } else {
      const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
      
      // Получаем список удалённых навсегда атрибутов
      const deletedAttributesStr = localStorage.getItem(DELETED_ATTRIBUTES_KEY);
      const deletedAttributes = deletedAttributesStr ? new Set(JSON.parse(deletedAttributesStr)) : new Set<string>();
      
      // Фильтруем атрибуты, исключая удалённые
      const filteredKeys = attributeKeys.filter(key => !deletedAttributes.has(key));
      
      // Сортируем ключи по DEFAULT_ATTRIBUTE_ORDER
      const sortedKeys = filteredKeys.sort((a, b) => {
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
      
      const displayNames: Record<string, string> = {
        'region': 'Регион',
        'segment': 'Сегмент',
        'uchastok': 'Земельный участок',
        'ID': 'ID',
        'ekspos': 'Стоимость',
        'ird': 'Наличие ИРД',
        'oks': 'Наличие ОКС',
        'status_mpt': 'Статус МПТ',
        'lgota': 'Льгота по налогу',
        'date': 'Срок реализации',
        'prava': 'Права',
        'pravoobl': 'Правообладатель',
        'zareg_ogran': 'Зарегистрированные ограничения',
        'broker': 'Брокер',
        'contacts': 'Контакты',
        'soinvest': 'Возможность соинвестирования',
        'str_soor': 'Строения и сооружения',
        'grad_param': 'Градостроительные параметры',
        'istochnik': 'Источник',
        'type_predl': 'Тип предложения',
        'status_publ': 'Статус публикации',
        'insight': 'Инсайт'
      };
      
      // Сохраняем список ключей для отслеживания удалений
      setPreviousConfigKeys(new Set(sortedKeys));
      
      const newConfigs: DisplayConfig[] = sortedKeys.map((key, index) => {
        const defaultConfig: DisplayConfig = {
          id: Date.now() + index,
          configType: 'attribute',
          configKey: key,
          originalKey: key,
          displayName: displayNames[key] || key,
          displayOrder: index,
          visibleRoles: ['admin'],
          enabled: true,
          settings: {},
          formatType: 'text'
        };
        
        if (key === 'region') {
          defaultConfig.formatType = 'select';
          defaultConfig.formatOptions = {
            options: ['Москва и МО', 'СПб и ЛО', 'Другие регионы']
          };
        }
        
        if (key === 'ekspos') {
          defaultConfig.formatType = 'money';
        }
        
        if (key === 'oks') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'status_mpt') {
          defaultConfig.formatType = 'toggle';
          defaultConfig.formatOptions = {
            trueLabel: 'Да',
            falseLabel: 'Нет'
          };
        }
        
        if (key === 'ID') {
          defaultConfig.formatType = 'text';
        }
        
        return defaultConfig;
      });
      
      setConfigs(newConfigs);
    }
  };

  const saveConfigs = async (onAttributesUpdate?: (attributes: Record<string, any>) => void) => {
    // 🔄 СНАЧАЛА синхронизируем настройки в БД
    try {
      const response = await fetch(`${func2url['update-attributes']}?action=sync_configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Настройки синхронизированы в БД:', result.message);
      } else {
        console.warn('⚠️ Не удалось синхронизировать настройки в БД');
      }
    } catch (error) {
      console.error('❌ Ошибка синхронизации в БД:', error);
    }
    
    const configsMap: Record<string, DisplayConfig> = {};
    configs.forEach(c => {
      configsMap[c.configKey] = c;
    });
    
    // Определяем удалённые атрибуты (которые были, но теперь их нет)
    const currentConfigKeys = new Set(configs.map(c => c.originalKey || c.configKey));
    const deletedKeys = Array.from(previousConfigKeys).filter(key => !currentConfigKeys.has(key));
    
    // Сохраняем удалённые атрибуты в список "удалённых навсегда"
    if (deletedKeys.length > 0) {
      const deletedAttributesStr = localStorage.getItem(DELETED_ATTRIBUTES_KEY);
      const deletedAttributes = deletedAttributesStr ? new Set(JSON.parse(deletedAttributesStr)) : new Set<string>();
      deletedKeys.forEach(key => deletedAttributes.add(key));
      localStorage.setItem(DELETED_ATTRIBUTES_KEY, JSON.stringify(Array.from(deletedAttributes)));
    }
    
    // Удаляем атрибуты из всех объектов в БД
    for (const key of deletedKeys) {
      try {
        const response = await fetch(`${func2url['update-attributes']}?action=delete_attribute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
        
        if (response.ok) {
          const result = await response.json();
          toast.success(`Атрибут "${key}" удалён из ${result.affectedRows} объектов`);
        }
      } catch (error) {
        console.error('Error deleting attribute:', error);
      }
    }
    
    // Определяем новые атрибуты (те, у которых нет originalKey)
    const newAttributes = configs.filter(c => !c.originalKey || c.originalKey === c.configKey);
    
    // Добавляем новые атрибуты во все объекты в БД
    for (const config of newAttributes) {
      try {
        const response = await fetch(`${func2url['update-attributes']}?action=add_attribute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: config.configKey,
            formatType: config.formatType || 'text'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.affectedRows > 0) {
            toast.success(`Атрибут "${config.displayName}" добавлен в ${result.affectedRows} объектов`);
          }
        }
      } catch (error) {
        console.error('Error adding attribute:', error);
      }
    }
    
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(configsMap));
    
    // Экспорт настроек для опубликованного домена (создаём публичный файл)
    try {
      const publicConfigs = configs.map(c => ({
        id: c.id,
        configType: c.configType,
        configKey: c.configKey,
        originalKey: c.originalKey,
        displayName: c.displayName,
        displayOrder: c.displayOrder,
        visibleRoles: c.visibleRoles,
        enabled: c.enabled,
        formatType: c.formatType,
        formatOptions: c.formatOptions,
        conditionalDisplay: c.conditionalDisplay
      }));
      
      // Сохраняем в localStorage для кросс-доменной синхронизации
      localStorage.setItem('attributeConfigs_public', JSON.stringify(publicConfigs));
      console.log('✅ Настройки экспортированы для публичного домена');
    } catch (error) {
      console.error('❌ Ошибка экспорта настроек:', error);
    }
    
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
    
    // Обновляем список ключей для отслеживания удалений
    setPreviousConfigKeys(new Set(configs.map(c => c.originalKey || c.configKey)));
    
    toast.success('Настройки сохранены для всех объектов');
    
    if (renamedKeys.length > 0 || deletedKeys.length > 0) {
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