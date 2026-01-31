import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { DisplayConfig } from '@/services/displayConfigService';

interface ConfigItemCardProps {
  config: DisplayConfig;
  index: number;
  originalIndex: number;
  draggedIndex: number | null;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  onToggleEnabled: (config: DisplayConfig) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (config: DisplayConfig) => void;
  onDelete: (id: number) => void;
}

const ConfigItemCard = ({
  config,
  index,
  originalIndex,
  draggedIndex,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: ConfigItemCardProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attribute': return 'Tag';
      case 'image': return 'Image';
      case 'document': return 'FileText';
      case 'contact_button': return 'Phone';
      default: return 'Box';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attribute': return 'Атрибут';
      case 'image': return 'Изображения';
      case 'document': return 'Документы';
      case 'contact_button': return 'Кнопка связи';
      case 'custom_element': return 'Другое';
      default: return type;
    }
  };

  const getFormatLabel = (formatType?: string) => {
    switch (formatType) {
      case 'text': return 'Текст';
      case 'textarea': return 'Многострочный текст';
      case 'number': return 'Число';
      case 'money': return 'Деньги';
      case 'boolean': return 'Да/Нет';
      case 'select': return 'Список';
      case 'date': return 'Дата';
      default: return null;
    }
  };

  return (
    <div
      key={config.id}
      draggable
      onDragStart={() => onDragStart(originalIndex)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={() => onDrop(index)}
      className={`flex items-center gap-3 p-4 border rounded-lg transition-all duration-200 ${
        !config.enabled ? 'opacity-50' : ''
      } ${
        draggedIndex === originalIndex ? 'opacity-40' : ''
      } cursor-move hover:border-primary/50`}
    >
      <Icon name="GripVertical" size={20} className="text-muted-foreground cursor-grab active:cursor-grabbing" />
      <Icon name={getTypeIcon(config.configType) as any} size={20} className="text-primary" />
      
      <div className="flex-1">
        <div className="font-medium">{config.displayName}</div>
        <div className="text-sm text-muted-foreground">
          {getTypeLabel(config.configType)} · {config.configKey}
          {config.configType === 'attribute' && config.formatType && (
            <> · {getFormatLabel(config.formatType)}</>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {config.visibleRoles.map(role => (
          <Badge key={role} variant="secondary" className="text-xs">
            {role}
          </Badge>
        ))}
      </div>

      <Switch
        checked={config.enabled}
        onCheckedChange={() => onToggleEnabled(config)}
      />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveUp(originalIndex)}
          disabled={isFirst}
        >
          <Icon name="ChevronUp" size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveDown(originalIndex)}
          disabled={isLast}
        >
          <Icon name="ChevronDown" size={18} />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(config)}
      >
        <Icon name="Pencil" size={18} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(config.id)}
      >
        <Icon name="Trash2" size={18} className="text-destructive" />
      </Button>
    </div>
  );
};

export default ConfigItemCard;
