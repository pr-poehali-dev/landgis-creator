import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';
import AttributeEditField, { formatValue } from './AttributeEditField';

interface AttributeViewModeProps {
  configs: DisplayConfig[];
  attributes: Record<string, any>;
  isEditing: boolean;
  onEdit: () => void;
  onConfigure: () => void;
  onSave: () => void;
  onCancel: () => void;
  renderEditField: (actualKey: string, value: any, config: DisplayConfig) => React.ReactNode;
}

const AttributeViewMode = ({
  configs,
  attributes,
  isEditing,
  onEdit,
  onConfigure,
  onSave,
  onCancel,
  renderEditField
}: AttributeViewModeProps) => {
  const shouldShowField = (config: DisplayConfig): boolean => {
    if (!config.conditionalDisplay) return true;
    
    const { dependsOn, showWhen } = config.conditionalDisplay;
    if (!dependsOn) return true;
    
    const parentValue = attributes?.[dependsOn];
    
    if (Array.isArray(showWhen)) {
      return showWhen.some(val => {
        if (Array.isArray(parentValue)) {
          return parentValue.includes(val);
        }
        return String(parentValue) === String(val);
      });
    }
    
    if (Array.isArray(parentValue)) {
      return parentValue.includes(showWhen);
    }
    
    return String(parentValue) === String(showWhen);
  };

  return (
    <>
      <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 border-b border-border">
        {!isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigure}
            >
              <Icon name="Settings" size={16} className="mr-2" />
              Настроить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
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
              onClick={onCancel}
            >
              <Icon name="X" size={16} className="mr-2" />
              Отмена
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
            >
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить
            </Button>
          </>
        )}
      </div>

      {configs.map((config) => {
        const actualKey = config.originalKey || config.configKey;
        
        if (!shouldShowField(config)) {
          return null;
        }

        // Получаем значение динамически при каждом рендере
        const value = attributes?.[actualKey];

        return (
          <div key={`${config.id}-${actualKey}-${value}`} className="pb-3 border-b border-border last:border-0">
            <p className="text-xs font-semibold text-primary mb-1">
              {config.displayName}
            </p>
            {isEditing ? (
              renderEditField(actualKey, value, config)
            ) : (
              <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                {formatValue(value, config.formatType, config.formatOptions)}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default AttributeViewMode;