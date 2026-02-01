import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';
import { UserRole, canAccessAttribute } from '@/types/userRoles';
import AddElementDialog from '@/components/AddElementDialog';
import AttributeEditField from '@/components/attributes/AttributeEditField';
import AttributeConfigItem from '@/components/attributes/AttributeConfigItem';
import AttributeViewMode from '@/components/attributes/AttributeViewMode';

interface AttributesDisplayProps {
  attributes?: Record<string, any>;
  userRole?: string;
  featureId?: number;
  onAttributesUpdate?: (attributes: Record<string, any>) => void;
}

const AttributesDisplay = ({ attributes, userRole = 'user1', featureId, onAttributesUpdate }: AttributesDisplayProps) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<Record<string, any>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, [attributes]);

  const cleanupObsoleteAttributes = () => {
    if (!attributes) return;
    
    const savedConfigs = localStorage.getItem('attributeConfigs');
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
      localStorage.setItem('attributeConfigs', JSON.stringify(cleanedConfigs));
      loadConfigs();
      toast.success('Удалены атрибуты, которых больше нет в базе данных');
    } else {
      toast.info('Все атрибуты актуальны');
    }
  };



  useEffect(() => {
    if (attributes) {
      setEditedAttributes(attributes);
    }
  }, [attributes]);

  const loadConfigs = () => {
    if (!attributes) return;
    
    const saved = localStorage.getItem('attributeConfigs');
    let savedConfigs: Record<string, DisplayConfig> = {};
    
    if (saved) {
      savedConfigs = JSON.parse(saved);
      
      // Автоматическое обновление типа ekspos на money
      if (savedConfigs['ekspos'] && savedConfigs['ekspos'].formatType !== 'money') {
        savedConfigs['ekspos'].formatType = 'money';
        savedConfigs['ekspos'].displayName = 'Стоимость';
        localStorage.setItem('attributeConfigs', JSON.stringify(savedConfigs));
      }
      
      // Автоматическое обновление типа ID на text (для сохранения ведущих нулей)
      if (savedConfigs['ID'] && savedConfigs['ID'].formatType !== 'text') {
        savedConfigs['ID'].formatType = 'text';
        localStorage.setItem('attributeConfigs', JSON.stringify(savedConfigs));
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
        localStorage.setItem('attributeConfigs', JSON.stringify(savedConfigs));
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
      const newConfigs: DisplayConfig[] = attributeKeys.map((key, index) => {
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
        
        return defaultConfig;
      });
      
      setConfigs(newConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
    }
  };

  const saveConfigs = async () => {
    const configsMap: Record<string, DisplayConfig> = {};
    configs.forEach(c => {
      configsMap[c.configKey] = c;
    });
    localStorage.setItem('attributeConfigs', JSON.stringify(configsMap));
    
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
    setIsConfigMode(false);
    
    if (renamedKeys.length > 0 && onAttributesUpdate) {
      window.location.reload();
    }
  };

  const handleSave = async () => {
    console.log('handleSave called', { featureId, editedAttributes });
    
    if (!featureId) {
      toast.error('Не удалось определить объект');
      return;
    }

    try {
      const url = `${func2url['update-attributes']}?id=${featureId}`;
      const payload = { attributes: editedAttributes };
      
      console.log('Sending PUT request:', { url, payload });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to update attributes');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast.success('Атрибуты сохранены');
      setIsEditing(false);
      
      if (onAttributesUpdate) {
        try {
          onAttributesUpdate(editedAttributes);
        } catch (callbackError) {
          console.error('Error in onAttributesUpdate callback:', callbackError);
        }
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast.error('Не удалось сохранить атрибуты');
    }
  };

  const handleCancel = () => {
    setEditedAttributes(attributes || {});
    setIsEditing(false);
  };

  const handleAttributeChange = (key: string, value: string) => {
    setEditedAttributes(prev => ({
      ...prev,
      [key]: value
    }));
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
    ) return;

    const newConfigs = [...configs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newConfigs[index], newConfigs[targetIndex]] = [newConfigs[targetIndex], newConfigs[index]];
    
    newConfigs.forEach((c, i) => {
      c.displayOrder = i;
    });
    
    setConfigs(newConfigs);
  };

  const toggleConfigEnabled = (index: number) => {
    const newConfigs = [...configs];
    newConfigs[index].enabled = !newConfigs[index].enabled;
    setConfigs(newConfigs);
  };

  const deleteConfig = (index: number) => {
    const configToDelete = configs[index];
    const confirmed = window.confirm(
      `Удалить атрибут "${configToDelete.displayName}" (${configToDelete.configKey})?\n\nВнимание: данные из базы не удалятся, просто атрибут перестанет отображаться.`
    );
    
    if (!confirmed) return;
    
    const newConfigs = configs.filter((_, i) => i !== index);
    newConfigs.forEach((c, i) => {
      c.displayOrder = i;
    });
    setConfigs(newConfigs);
    toast.success(`Атрибут "${configToDelete.displayName}" удалён из отображения`);
  };

  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

  const renderEditField = (key: string, value: any, config?: DisplayConfig) => {
    return (
      <AttributeEditField
        value={value}
        config={config}
        onValueChange={(newValue) => handleAttributeChange(key, newValue)}
      />
    );
  };

  const displayAttributes = isEditing ? editedAttributes : attributes;
  const enabledConfigs = configs.filter(c => {
    const hasAccess = c.enabled && canAccessAttribute(userRole as UserRole, c.visibleRoles);
    // В режиме редактирования показываем все настроенные атрибуты
    if (isEditing && c.configType === 'attribute') {
      return hasAccess;
    }
    // В режиме просмотра показываем только если есть данные
    const hasData = attributes && (attributes[c.originalKey || c.configKey] !== undefined);
    return hasAccess && hasData;
  });

  if (isConfigMode) {
    return (
      <>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-sm font-semibold">Настройка атрибутов</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cleanupObsoleteAttributes}
              title="Очистить атрибуты, которых больше нет в базе"
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Очистка
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadConfigs();
                setIsConfigMode(false);
              }}
            >
              <Icon name="X" size={16} className="mr-2" />
              Отмена
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveConfigs}
            >
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {configs.map((config, index) => (
            <AttributeConfigItem
              key={config.id}
              config={config}
              index={index}
              totalConfigs={configs.length}
              allConfigs={configs}
              onConfigChange={handleConfigChange}
              onMoveConfig={moveConfig}
              onToggleEnabled={toggleConfigEnabled}
              onDelete={deleteConfig}
            />
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Icon name="Plus" size={16} />
            Добавить элемент
          </Button>
          
          <AddElementDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAdd={(type) => {
              const newConfig: DisplayConfig = {
                id: Date.now(),
                configType: type,
                configKey: type === 'attribute' ? `new_field_${configs.length + 1}` : `${type}_${configs.length + 1}`,
                displayName: type === 'attribute' ? 'Новое поле' : 
                            type === 'button' ? 'Кнопка' :
                            type === 'iframe' ? 'Iframe' :
                            type === 'image' ? 'Изображение' :
                            type === 'document' ? 'Файл' : 'Кнопка связи',
                displayOrder: configs.length,
                visibleRoles: ['admin'],
                enabled: true,
                settings: {},
                formatType: type === 'attribute' ? 'text' : undefined
              };
              setConfigs([...configs, newConfig]);
            }}
          />
        </div>
      </>
    );
  }

  return (
    <AttributeViewMode
      configs={enabledConfigs}
      attributes={displayAttributes}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onConfigure={() => setIsConfigMode(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      renderEditField={renderEditField}
    />
  );
};

export default AttributesDisplay;