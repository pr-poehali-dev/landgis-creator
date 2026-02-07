import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';
import AttributeEditField, { formatValue } from './AttributeEditField';
import { authService } from '@/services/authService';
import { propertyService } from '@/services/propertyService';
import { visibilityService } from '@/services/visibilityService';
import { toast } from 'sonner';
import { useState } from 'react';
import { UserRole } from '@/types/userRoles';

interface AttributeViewModeProps {
  configs: DisplayConfig[];
  attributes: Record<string, any>;
  isEditing: boolean;
  editedAttributes?: Record<string, any>;
  userRole?: string;
  featureId?: number;
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
  editedAttributes,
  userRole = 'user1',
  featureId,
  onEdit,
  onConfigure,
  onSave,
  onCancel,
  renderEditField
}: AttributeViewModeProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!featureId) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот объект? Это действие необратимо.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await propertyService.deleteProperty(featureId);
      toast.success('Объект успешно удалён');
      // Закрываем панель
      window.dispatchEvent(new CustomEvent('property-deleted'));
    } catch (error) {
      toast.error('Не удалось удалить объект');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  const shouldShowField = (config: DisplayConfig): boolean => {
    if (!config.conditionalDisplay) return true;
    
    const { dependsOn, showWhen } = config.conditionalDisplay;
    if (!dependsOn) return true;
    
    const parentValue = attributes?.[dependsOn];
    
    // Normalize values for comparison (handle boolean, "Да"/"да", true, etc.)
    const normalizeValue = (val: any): string => {
      if (typeof val === 'boolean') return val ? 'да' : 'нет';
      if (typeof val === 'string') return val.toLowerCase().trim();
      return String(val).toLowerCase().trim();
    };
    
    if (Array.isArray(showWhen)) {
      return showWhen.some(val => {
        if (Array.isArray(parentValue)) {
          return parentValue.some(pv => normalizeValue(pv) === normalizeValue(val));
        }
        return normalizeValue(parentValue) === normalizeValue(val);
      });
    }
    
    if (Array.isArray(parentValue)) {
      return parentValue.some(pv => normalizeValue(pv) === normalizeValue(showWhen));
    }
    
    return normalizeValue(parentValue) === normalizeValue(showWhen);
  };

  const realUserRole = authService.getUser()?.role as UserRole;
  const isRealAdmin = realUserRole === 'admin';
  const canEdit = visibilityService.canEditProperty(realUserRole);
  
  return (
    <>
      <div className="flex justify-between gap-2 mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 border-b border-border">
        <div>
          {isEditing && isRealAdmin && featureId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors p-1"
              title="Удалить объект"
            >
              <Icon name={isDeleting ? "Loader2" : "Trash2"} size={20} className={isDeleting ? "animate-spin" : ""} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              {isRealAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onConfigure}
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  Настроить
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Icon name="Pencil" size={16} className="mr-2" />
                  Редактировать
                </Button>
              )}
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
      </div>

      {configs.map((config) => {
        const actualKey = config.originalKey || config.configKey;
        
        if (!shouldShowField(config)) {
          return null;
        }

        // В режиме редактирования берём из editedAttributes, в режиме просмотра - из attributes
        const dataSource = isEditing ? (editedAttributes || attributes) : attributes;
        const value = dataSource?.[actualKey];
        
        // Скрываем пустые атрибуты в режиме просмотра
        if (!isEditing && config.formatType !== 'button') {
          const isEmpty = value === undefined || value === null || value === '' || 
                         (Array.isArray(value) && value.length === 0);
          if (isEmpty) {
            return null;
          }
        }
        
        console.log('Rendering field:', { actualKey, value, isEditing, dataSource });

        return (
          <div key={`${config.id}-${actualKey}`} className="pb-3 border-b border-border last:border-0">
            <p className="text-xs font-semibold text-primary mb-1">
              {config.displayName}
            </p>
            {isEditing ? (
              renderEditField(actualKey, value, config)
            ) : config.formatType === 'button' ? (
              (() => {
                // Дефолтные значения из formatOptions или общие дефолты
                const defaultText = config.formatOptions?.text || 'Кнопка';
                const defaultAction = Array.isArray(config.formatOptions?.actions) && config.formatOptions.actions.length > 0
                  ? config.formatOptions.actions[0]
                  : 'Добавить в корзину';
                
                let buttonData = { text: defaultText, action: defaultAction };
                
                // Если есть сохранённые данные - используем их
                try {
                  if (typeof value === 'string' && value) {
                    buttonData = JSON.parse(value);
                  } else if (typeof value === 'object' && value !== null) {
                    buttonData = value;
                  }
                } catch {}
                
                return (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      console.log('Button action:', buttonData.action);
                      // Здесь будет логика действий
                    }}
                  >
                    {buttonData.text}
                  </Button>
                );
              })()
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