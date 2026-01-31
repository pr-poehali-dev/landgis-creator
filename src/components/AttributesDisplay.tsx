import { useState, useEffect } from 'react';
import { displayConfigService, DisplayConfig } from '@/services/displayConfigService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface AttributesDisplayProps {
  attributes?: Record<string, any>;
  userRole?: string;
  featureId?: number;
  onAttributesUpdate?: (attributes: Record<string, any>) => void;
}

const AttributesDisplay = ({ attributes, userRole = 'user', featureId, onAttributesUpdate }: AttributesDisplayProps) => {
  const [configs, setConfigs] = useState<DisplayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<Record<string, any>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (attributes) {
      setEditedAttributes(attributes);
    }
  }, [attributes]);

  const loadConfigs = async () => {
    try {
      // Используем те же дефолтные данные, что и в DisplayConfig
      const defaultConfigs: DisplayConfig[] = [
        { id: 12, configType: 'attribute', configKey: 'ID', displayName: 'ID', displayOrder: 0, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 26, configType: 'attribute', configKey: 'test_attr', displayName: 'Test Attribute', displayOrder: 1, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 3, configType: 'attribute', configKey: 'prava', displayName: 'Права', displayOrder: 2, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 1, configType: 'attribute', configKey: 'name', displayName: 'Название', displayOrder: 3, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 2, configType: 'attribute', configKey: 'uchastok', displayName: 'Участок', displayOrder: 4, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 4, configType: 'attribute', configKey: 'ird', displayName: 'ИРД', displayOrder: 5, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 5, configType: 'attribute', configKey: 'grad_param', displayName: 'Градостроительные параметры', displayOrder: 6, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 6, configType: 'attribute', configKey: 'oks', displayName: 'Наличие ОКС', displayOrder: 7, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 7, configType: 'attribute', configKey: 'segment', displayName: 'Сегмент', displayOrder: 8, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 8, configType: 'attribute', configKey: 'ekspos', displayName: 'Экспозиция', displayOrder: 9, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 9, configType: 'attribute', configKey: 'date', displayName: 'Дата', displayOrder: 10, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 10, configType: 'attribute', configKey: 'status_publ', displayName: 'Статус публикации', displayOrder: 11, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 13, configType: 'attribute', configKey: 'id', displayName: 'Id', displayOrder: 12, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 14, configType: 'attribute', configKey: '_id', displayName: '_id', displayOrder: 13, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 15, configType: 'attribute', configKey: 'broker', displayName: 'Broker', displayOrder: 14, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 16, configType: 'attribute', configKey: 'insight', displayName: 'Insight', displayOrder: 15, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 17, configType: 'attribute', configKey: 'contacts', displayName: 'Contacts', displayOrder: 16, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 18, configType: 'attribute', configKey: 'pravoobl', displayName: 'Pravoobl', displayOrder: 17, visibleRoles: ['admin'], enabled: true, settings: {} },
        { id: 19, configType: 'attribute', configKey: 'soinvest', displayName: 'Soinvest', displayOrder: 18, visibleRoles: ['admin'], enabled: false, settings: {} },
        { id: 20, configType: 'attribute', configKey: 'str_soor', displayName: 'Str soor', displayOrder: 19, visibleRoles: ['admin'], enabled: false, settings: {} },
        { id: 21, configType: 'attribute', configKey: 'telegram', displayName: 'Telegram', displayOrder: 20, visibleRoles: ['admin'], enabled: false, settings: {} },
        { id: 22, configType: 'attribute', configKey: 'type_predl', displayName: 'Type predl', displayOrder: 21, visibleRoles: ['admin'], enabled: false, settings: {} },
        { id: 23, configType: 'attribute', configKey: 'zareg_ogran', displayName: 'Zareg ogran', displayOrder: 22, visibleRoles: ['admin'], enabled: false, settings: {} },
      ];
      
      // Пробуем загрузить из localStorage (работает только на preview-домене)
      const localConfigs = displayConfigService.getLocalConfigs();
      if (localConfigs.length > 0) {
        setConfigs(localConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
      } else {
        setConfigs(defaultConfigs);
      }
    } catch (error) {
      console.error('Error loading display configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!featureId) {
      toast.error('Не удалось определить объект');
      return;
    }

    try {
      const response = await fetch(`${func2url['update-attributes']}?id=${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: editedAttributes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attributes');
      }

      toast.success('Атрибуты сохранены');
      setIsEditing(false);
      
      if (onAttributesUpdate) {
        onAttributesUpdate(editedAttributes);
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

  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  const enabledConfigs = configs
    .filter(c => c.enabled && displayConfigService.isVisibleForRole(c, userRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
  
  const orderedKeys = [
    ...enabledConfigs
      .map(c => c.configKey)
      .filter(key => attributeKeys.includes(key)),
    ...attributeKeys.filter(key => !enabledConfigs.find(c => c.configKey === key))
  ];

  const getDisplayName = (key: string): string => {
    const config = configs.find(c => c.configKey === key);
    return config?.displayName || key;
  };

  const getConfig = (key: string): DisplayConfig | undefined => {
    return configs.find(c => c.configKey === key);
  };

  const formatValue = (value: any, formatType?: string): string => {
    if (value === null || value === undefined) return '—';
    
    switch (formatType) {
      case 'money':
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value));
      case 'number':
        return new Intl.NumberFormat('ru-RU').format(Number(value));
      case 'boolean':
        return value ? 'Да' : 'Нет';
      case 'date':
        return new Date(value).toLocaleDateString('ru-RU');
      default:
        return String(value);
    }
  };

  const renderEditField = (key: string, value: any, config?: DisplayConfig) => {
    const formatType = config?.formatType || 'text';
    
    switch (formatType) {
      case 'textarea':
        return (
          <Textarea
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => handleAttributeChange(key, e.target.value)}
            className="text-sm min-h-[80px]"
          />
        );
      
      case 'number':
      case 'money':
        return (
          <Input
            type="number"
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => handleAttributeChange(key, e.target.value)}
            className="text-sm"
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleAttributeChange(key, String(checked))}
          />
        );
      
      case 'select':
        const options = config?.formatOptions?.options || [];
        return (
          <Select
            value={value !== null && value !== undefined ? String(value) : ''}
            onValueChange={(val) => handleAttributeChange(key, val)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Выберите значение" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => handleAttributeChange(key, e.target.value)}
            className="text-sm"
          />
        );
      
      default:
        return (
          <Input
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => handleAttributeChange(key, e.target.value)}
            className="text-sm"
          />
        );
    }
  };

  const displayAttributes = isEditing ? editedAttributes : attributes;

  return (
    <>
      <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 border-b border-border">
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Icon name="Pencil" size={16} className="mr-2" />
            Редактировать
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <Icon name="X" size={16} className="mr-2" />
              Отмена
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить
            </Button>
          </>
        )}
      </div>

      {orderedKeys.map((key) => {
        const value = displayAttributes?.[key];
        const config = getConfig(key);

        return (
          <div key={key} className="pb-3 border-b border-border last:border-0">
            <p className="text-xs font-semibold text-primary mb-1">
              {getDisplayName(key)}
            </p>
            {isEditing ? (
              renderEditField(key, value, config)
            ) : (
              <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                {formatValue(value, config?.formatType)}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default AttributesDisplay;