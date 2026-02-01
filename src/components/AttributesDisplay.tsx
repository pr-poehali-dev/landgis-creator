import { useState, useEffect } from 'react';
import { DisplayConfig } from '@/services/displayConfigService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';
import { UserRole, canAccessAttribute } from '@/types/userRoles';
import AddElementDialog from '@/components/AddElementDialog';

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
    }
    
    const attributeKeys = Object.keys(attributes).filter(k => k !== 'geometry_name');
    const newConfigs: DisplayConfig[] = attributeKeys.map((key, index) => {
      const existing = Object.values(savedConfigs).find(c => c.originalKey === key || c.configKey === key);
      return existing || {
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
    });
    
    setConfigs(newConfigs.sort((a, b) => a.displayOrder - b.displayOrder));
  };

  const saveConfigs = () => {
    const configsMap: Record<string, DisplayConfig> = {};
    configs.forEach(c => {
      configsMap[c.configKey] = c;
    });
    localStorage.setItem('attributeConfigs', JSON.stringify(configsMap));
    toast.success('Настройки сохранены для всех объектов');
    setIsConfigMode(false);
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

      if (!response.ok) throw new Error('Failed to update attributes');

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

  if (!attributes || Object.keys(attributes).length === 0) {
    return <div className="text-sm text-muted-foreground">Нет атрибутов</div>;
  }

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
  const enabledConfigs = configs.filter(c => {
    const hasAccess = c.enabled && canAccessAttribute(userRole as UserRole, c.visibleRoles);
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
            <div key={config.id} className="border rounded-lg p-3 space-y-3 bg-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => toggleConfigEnabled(index)}
                  />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Ключ (БД)</label>
                      <Input
                        value={config.originalKey || config.configKey}
                        disabled
                        className="text-xs h-7 bg-muted cursor-not-allowed"
                        placeholder="key_name"
                        title="Ключ из базы данных (только для чтения)"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block">Название</label>
                      <Input
                        value={config.displayName}
                        onChange={(e) => handleConfigChange(index, 'displayName', e.target.value)}
                        className="text-xs h-7"
                        placeholder="Отображаемое имя"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveConfig(index, 'up')}
                    disabled={index === 0}
                  >
                    <Icon name="ChevronUp" size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveConfig(index, 'down')}
                    disabled={index === configs.length - 1}
                  >
                    <Icon name="ChevronDown" size={14} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Тип поля</label>
                <Select
                  value={config.formatType || 'text'}
                  onValueChange={(value) => handleConfigChange(index, 'formatType', value)}
                >
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Текст</SelectItem>
                    <SelectItem value="textarea">Многострочный текст</SelectItem>
                    <SelectItem value="number">Число</SelectItem>
                    <SelectItem value="money">Денежная сумма</SelectItem>
                    <SelectItem value="boolean">Да/Нет</SelectItem>
                    <SelectItem value="select">Выпадающий список</SelectItem>
                    <SelectItem value="date">Дата</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.formatType === 'select' && (
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Варианты списка</label>
                  <Input
                    value={config.formatOptions?.options?.join(', ') || ''}
                    onChange={(e) => {
                      const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                      handleConfigChange(index, 'formatOptions', { options });
                    }}
                    placeholder="Опция 1, Опция 2, Опция 3"
                    className="text-xs h-7"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Доступно для ролей</label>
                <div className="flex flex-wrap gap-1.5">
                  {['admin', 'user1', 'user2', 'user3', 'user4'].map((role) => (
                    <label key={role} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-border hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.visibleRoles.includes(role)}
                        onChange={(e) => {
                          const roles = e.target.checked
                            ? [...config.visibleRoles, role]
                            : config.visibleRoles.filter(r => r !== role);
                          handleConfigChange(index, 'visibleRoles', roles);
                        }}
                        className="rounded h-3 w-3"
                      />
                      <span>{role === 'admin' ? 'Админ' : role === 'user1' ? 'Free' : role === 'user2' ? 'Light' : role === 'user3' ? 'Max' : 'VIP'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
    <>
      <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 border-b border-border">
        {!isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigMode(true)}
            >
              <Icon name="Settings" size={16} className="mr-2" />
              Настроить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Icon name="Pencil" size={16} className="mr-2" />
              Редактировать
            </Button>
          </>
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

      {enabledConfigs.map((config) => {
        const actualKey = config.originalKey || config.configKey;
        const value = displayAttributes?.[actualKey];

        return (
          <div key={config.id} className="pb-3 border-b border-border last:border-0">
            <p className="text-xs font-semibold text-primary mb-1">
              {config.displayName}
            </p>
            {isEditing ? (
              renderEditField(actualKey, value, config)
            ) : (
              <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                {formatValue(value, config.formatType)}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default AttributesDisplay;